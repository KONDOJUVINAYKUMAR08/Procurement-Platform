import { Employee, EmployeeDocument } from '../models/Employee';
import { v4 as uuidv4 } from 'uuid';

const generateEmployeeId = async (): Promise<string> => {
  const all = await Employee.scan().exec();
  const num = String(all.length + 1).padStart(4, '0');
  return `EMP-${num}`;
};

export class EmployeeService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    let scanReq = Employee.scan();
    if (query.status) scanReq = scanReq.where('status').eq(query.status);
    if (query.department) scanReq = scanReq.where('department').eq(query.department);

    const all = await scanReq.exec();
    let filtered = [...all];

    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter((e: any) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(s) ||
        e.email?.toLowerCase().includes(s) ||
        e.employeeId?.toLowerCase().includes(s) ||
        e.designation?.toLowerCase().includes(s)
      );
    }

    filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { employees: filtered.slice(skip, skip + limit), total: filtered.length };
  }

  async findById(id: string) {
    const emp = await Employee.get(id);
    if (!emp) throw new Error('Employee not found');
    return emp;
  }

  async create(data: Partial<EmployeeDocument>, userId: string) {
    const employeeId = await generateEmployeeId();
    const gross = (data.basicSalary || 0) + (data.hra || 0) + (data.transportAllowance || 0) + (data.otherAllowances || 0);
    return await Employee.create({
      ...data,
      _id: uuidv4(),
      employeeId,
      grossSalary: gross,
      createdBy: userId,
    });
  }

  async update(id: string, data: Partial<EmployeeDocument>) {
    const emp = await Employee.get(id);
    if (!emp) throw new Error('Employee not found');
    if (data.basicSalary !== undefined || data.hra !== undefined) {
      data.grossSalary = (data.basicSalary ?? emp.basicSalary) + (data.hra ?? emp.hra) + (data.transportAllowance ?? emp.transportAllowance) + (data.otherAllowances ?? emp.otherAllowances);
    }
    return await Employee.update({ _id: id }, data);
  }

  async delete(id: string) {
    const emp = await Employee.get(id);
    if (!emp) throw new Error('Employee not found');
    await Employee.delete(id);
  }

  async getStats() {
    const all = await Employee.scan().exec();
    const byDept: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalPayroll = 0;

    all.forEach((e: any) => {
      if (e.status === 'active') {
        byDept[e.department || 'Unknown'] = (byDept[e.department || 'Unknown'] || 0) + 1;
        byType[e.employmentType || 'full_time'] = (byType[e.employmentType || 'full_time'] || 0) + 1;
        totalPayroll += e.grossSalary || 0;
      }
    });

    return {
      total: all.length,
      active: all.filter((e: any) => e.status === 'active').length,
      inactive: all.filter((e: any) => e.status !== 'active').length,
      byDepartment: Object.entries(byDept).map(([dept, count]) => ({ dept, count })),
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      totalPayroll: Math.round(totalPayroll * 100) / 100,
    };
  }
}

export default new EmployeeService();
