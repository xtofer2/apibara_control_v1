# Apibara Control - Product Definition

## Objective

Create an internal web application for Mi Negocio Apibara to control daily operations at its locations.

Initial locations:

- Av. Jesus
- Miguel Grau

The application is primarily mobile-first for employees and responsive for managers and administrators.

## Roles

### Employee

Can:

- log in
- mark attendance check-in/check-out
- open a location's operational shift
- register inventory entries
- register waste
- send products to another location
- confirm incoming transfers
- close the operational shift
- view the result of operations they are authorized to access

### Manager

Can additionally:

- view all operational shifts
- inspect openings and closings
- view calculated product sales
- view waste
- view transfers
- view attendance
- create inventory adjustments
- view audit information
- view reports
- manage product catalog if authorized

### Admin

Can additionally:

- manage users
- manage roles
- manage locations
- manage system configuration

## Daily operational flow

Typical flow:

Opening
-> product arrivals
-> waste
-> transfers between stores
-> sales
-> closing

Sales are not entered individually.

They are inferred from inventory reconciliation at closing.

## Opening example

Location: Av. Jesus

- 21 classic empanadas
- 15 pizza empanadas
- 15 full cheese empanadas
- 12 L Api Morado
- 6 L Api Blanco
- 3 L Emoliente
- S/ 80 initial physical cash

The system records employee, date and server-generated timestamp.

## Closing example

Inventory:

- physical remaining quantity for every active product

Payments:

- Cash: S/ 200
- Yape: S/ 150

The system calculates the total closing amount from payment methods but does not store a redundant total field.

Employee, date and timestamp are recorded automatically.

## Transfers

Example:

Av. Jesus sends to Miguel Grau:

- 20 classic
- 10 pizza

The origin employee sends the transfer.

Status becomes SENT.

Miguel Grau receives and counts the products.

If it receives:

- 19 classic
- 10 pizza

The transfer becomes RECEIVED_WITH_DIFFERENCES.

The destination inventory receives only:

- 19 classic
- 10 pizza

The discrepancy remains recorded and requires an observation.

## Attendance

Attendance does not depend on opening or closing operations.

Employees explicitly check in and check out at a location.

## Initial management needs

The manager must be able to answer:

- Which employees worked on a given day?
- Which employee opened or closed each location?
- What was recorded at opening and closing?
- How many units/liters were calculated as sold?
- What waste occurred?
- What transfers were sent and received?
- Which transfers had discrepancies?
- What cash and Yape amounts were recorded at closing?
