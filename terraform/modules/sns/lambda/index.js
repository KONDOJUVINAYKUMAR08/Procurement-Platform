const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const ses = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });

const getHeader = (title, color) => `
  <div style="background-color: ${color}; padding: 25px; text-align: center; color: white; border-top-left-radius: 8px; border-top-right-radius: 8px;">
    <h2 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">${title}</h2>
  </div>
`;

const getFooter = () => `
  <div style="background-color: #f8f9fa; padding: 15px 30px; text-align: center; font-size: 12px; color: #888; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; border-top: 1px solid #eee;">
    <p style="margin: 0; font-weight: bold;">Procurement Platform Monitor</p>
    <p style="margin: 4px 0 0 0; font-size: 11px; color: #aaa;">This is an automated notification. Please do not reply.</p>
  </div>
`;

const getTable = (rows) => `
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tbody>
      ${rows.map(row => `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; font-weight: bold; width: 40%; color: #666; font-size: 14px;">${row.label}</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; color: #333; font-size: 14px; word-break: break-all;">${row.value}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
`;

const getTemplateWrapper = (headerTitle, headerColor, introText, rows, footerNote = "") => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 30px 15px;">
      <div style="background-color: #ffffff; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e1e4e8;">
        ${getHeader(headerTitle, headerColor)}
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #444; margin: 0 0 20px 0;">${introText}</p>
          ${getTable(rows)}
          ${footerNote ? `<p style="font-size: 13px; color: #777; line-height: 1.5; margin: 20px 0 0 0; font-style: italic; background-color: #fafbfc; padding: 12px; border-radius: 6px; border-left: 3px solid ${headerColor};">${footerNote}</p>` : ''}
        </div>
        ${getFooter()}
      </div>
    </body>
  </html>
`;

exports.handler = async (event) => {
  console.log("Received Event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const sns = record.Sns;
    const subject = sns.Subject || "Procurement Platform Notification";
    const messageStr = sns.Message;
    
    let message;
    try {
      message = JSON.parse(messageStr);
    } catch (e) {
      message = messageStr;
    }

    let emailSubject = subject;
    let emailHtml = "";

    if (typeof message === "object" && message.AlarmName) {
      // CloudWatch Alarm Event
      const alarmName = message.AlarmName;
      const newState = message.NewStateValue;
      const reason = message.NewStateReason;
      const time = message.StateChangeTime || new Date().toISOString();
      const metric = message.Trigger?.MetricName || "Metric";

      if (metric === "CPUUtilization") {
        if (newState === "ALARM") {
          emailSubject = `🚨 [ALARM] CPU Utilization High: ${alarmName}`;
          emailHtml = getTemplateWrapper(
            "🚨 CRITICAL ALERT: High CPU Utilization",
            "#d9534f",
            "The system has detected that CPU usage has exceeded the threshold of <strong>70% for 2 minutes</strong>.",
            [
              { label: "Alarm Name", value: alarmName },
              { label: "State", value: '<span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">ALARM</span>' },
              { label: "State Reason", value: reason },
              { label: "Trigger Timestamp", value: time }
            ],
            "Auto Scaling group rules will trigger scale-out processes if this utilization persists."
          );
        } else if (newState === "OK") {
          emailSubject = `✅ [RECOVERED] CPU Utilization Normalized: ${alarmName}`;
          emailHtml = getTemplateWrapper(
            "✅ RECOVERED: CPU Utilization Normalized",
            "#5cb85c",
            "The CPU utilization has dropped below the threshold and normalized.",
            [
              { label: "Alarm Name", value: alarmName },
              { label: "State", value: '<span style="background-color: #5cb85c; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">OK</span>' },
              { label: "State Reason", value: reason },
              { label: "Trigger Timestamp", value: time }
            ]
          );
        }
      } else if (metric === "HTTPCode_Target_5XX_Count" || metric === "HTTPCode_ELB_5XX_Count") {
        emailSubject = `🚨 [ALARM] Elevated ALB 5XX Error Rate`;
        emailHtml = getTemplateWrapper(
          "🚨 CRITICAL ALERT: ALB 5XX Error Rate High",
          "#d9534f",
          "The Application Load Balancer has detected an elevated rate of <strong>5XX server errors</strong>.",
          [
            { label: "Alarm Name", value: alarmName },
            { label: "State", value: '<span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">ALARM</span>' },
            { label: "State Reason", value: reason },
            { label: "Trigger Timestamp", value: time }
          ],
          "This indicates backend application crashes or server-side issues. Please check server PM2 logs."
        );
      } else if (metric === "UnHealthyHostCount") {
        emailSubject = `⚠️ [WARNING] Unhealthy Target Group Hosts`;
        emailHtml = getTemplateWrapper(
          "⚠️ WARNING: Unhealthy Targets Detected",
          "#f0ad4e",
          "The target groups are reporting one or more unhealthy instances failing health checks.",
          [
            { label: "Alarm Name", value: alarmName },
            { label: "State", value: '<span style="background-color: #f0ad4e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">ALARM</span>' },
            { label: "State Reason", value: reason },
            { label: "Trigger Timestamp", value: time }
          ],
          "Failed targets are automatically removed from load balancing pool and terminated if ASG health checks fail."
        );
      } else {
        emailSubject = `🔔 [ALERT] ${alarmName} changed state to ${newState}`;
        emailHtml = getTemplateWrapper(
          `🔔 System Alert: ${newState}`,
          newState === "ALARM" ? "#d9534f" : newState === "OK" ? "#5cb85c" : "#f0ad4e",
          `Monitoring alarm '${alarmName}' has transitioned state.`,
          [
            { label: "Alarm Name", value: alarmName },
            { label: "New State", value: `<strong>${newState}</strong>` },
            { label: "State Reason", value: reason },
            { label: "Trigger Timestamp", value: time }
          ]
        );
      }
    } else if (typeof message === "object" && message.source === "aws.autoscaling") {
      // EventBridge ASG Lifecycle Event
      const detailType = message["detail-type"];
      const asgName = message.detail.AutoScalingGroupName;
      const instanceId = message.detail.EC2InstanceId;
      const cause = message.detail.Cause || "Auto Scaling action";
      const time = message.time || new Date().toISOString();

      if (detailType === "EC2 Instance Launch Successful") {
        emailSubject = `🚀 [ASG Scale Out] New Instance Launched in ${asgName}`;
        emailHtml = getTemplateWrapper(
          "🚀 ASG SCALE OUT: Instance Launched / Scale Out",
          "#0275d8",
          "A new EC2 instance has been successfully launched by Auto Scaling to handle demand.",
          [
            { label: "Auto Scaling Group", value: asgName },
            { label: "Instance ID", value: `<code>${instanceId}</code>` },
            { label: "Reason / Trigger", value: cause },
            { label: "Launch Timestamp", value: time }
          ]
        );
      } else if (detailType === "EC2 Instance Terminate Successful") {
        emailSubject = `📉 [ASG Scale In] Instance Terminated in ${asgName}`;
        emailHtml = getTemplateWrapper(
          "📉 ASG SCALE IN: Instance Terminated / Scale In",
          "#373a3c",
          "An EC2 instance has been terminated as part of scale-in or healthy lifecycle operations.",
          [
            { label: "Auto Scaling Group", value: asgName },
            { label: "Instance ID", value: `<code>${instanceId}</code>` },
            { label: "Reason / Event", value: cause },
            { label: "Termination Timestamp", value: time }
          ]
        );
      } else {
        emailSubject = `ℹ️ [ASG Lifecycle] Event: ${detailType}`;
        emailHtml = getTemplateWrapper(
          "ℹ️ ASG Lifecycle Event Notification",
          "#0275d8",
          `Auto Scaling Group '${asgName}' reported a lifecycle event.`,
          [
            { label: "Auto Scaling Group", value: asgName },
            { label: "Event Type", value: detailType },
            { label: "Instance ID", value: `<code>${instanceId}</code>` },
            { label: "Cause / Details", value: cause },
            { label: "Event Timestamp", value: time }
          ]
        );
      }
    } else {
      // Fallback template
      emailSubject = `Notification: ${subject}`;
      emailHtml = getTemplateWrapper(
        "🔔 System Notification",
        "#0275d8",
        "A system alert has been dispatched.",
        [
          { label: "Subject", value: subject },
          { label: "Details", value: typeof message === 'object' ? `<pre style="font-family: monospace; background-color: #fafbfc; padding: 10px; border-radius: 4px; overflow: auto; max-height: 200px; margin: 0;">${JSON.stringify(message, null, 2)}</pre>` : message }
        ]
      );
    }

    const sender = process.env.SENDER_EMAIL;
    const recipient = process.env.RECIPIENT_EMAIL;

    if (!sender || !recipient) {
      console.error("SENDER_EMAIL or RECIPIENT_EMAIL environment variables are not set");
      continue;
    }

    try {
      const command = new SendEmailCommand({
        Source: sender,
        Destination: {
          ToAddresses: [recipient],
        },
        Message: {
          Subject: { Data: emailSubject },
          Body: {
            Html: { Data: emailHtml },
          },
        },
      });
      const res = await ses.send(command);
      console.log(`SES HTML Alert Email sent: ${res.MessageId}`);
    } catch (err) {
      console.error("Error sending SES email:", err);
    }
  }
};
