# Procurement Platform Infrastructure

This repository contains the infrastructure configuration for the Procurement Platform, structured into modular components.

## Directory Layout

- `environments/dev/` - Configuration parameters, variable values, backend, and provider configs for the dev environment.
- `modules/` - Encapsulated Terraform modules representing individual cloud infrastructure systems.

## Usage Instructions

To launch or modify the infrastructure, follow the step-by-step migration guide provided.
For new setups:
1. Navigate to the dev directory: `cd environments/dev`
2. Run `terraform init`
3. Run `terraform plan` to view changes
4. Run `terraform apply` to apply configuration updates
