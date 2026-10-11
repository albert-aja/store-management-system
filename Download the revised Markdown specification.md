# Store Management System

> **Document type:** Consolidated business and system requirements specification  
> **Source:** Store Management System requirements discussion PDF, 146 pages  
> **Scope rule:** This document preserves and organizes the source decisions. It does not introduce a database schema, API design, application architecture, or other technical implementation.  
> **Chronology rule:** The source is ordered from oldest at the top to latest at the bottom. When statements conflict, the latest statement is treated as the current requirement. Earlier statements are retained only when they add compatible context.

## Classification Convention

| Label | Meaning |
|---|---|
| **Confirmed** | Explicitly decided, finalized, locked, or stated as an agreed baseline in the source. |
| **Assumption** | Inferred from the discussion but not explicitly confirmed as a requirement. |
| **Open Question** | Explicitly left unresolved or pending further business data/discussion. |
| **Recommendation** | A suggestion made in the source discussion, not an existing requirement unless later confirmed. |
| **Superseded** | An earlier statement was replaced by a later statement under the source chronology rule. It is not treated as a current requirement. |

## 1. System Overview

### 1.1 Purpose

**Confirmed.** The Store Management System will replace or support the current paper-based operational and financial records of a multi-store electronics and furniture retailer. It will provide a centralized and reliable business record of products, customer sales, credit, collections, purchasing, supplier obligations, inventory movement, delivery, warranty, repossession, expenses, payroll-related data, cash movement, and management reporting.

The system is intended to provide management with data, history, warnings, workflows, approval controls, and auditability. It is not intended to replace managerial judgment with rigid automatic formulas.

### 1.2 Business Context

The business:

- Operates multiple electronics and furniture stores.
- Does not manufacture products.
- Purchases products from multiple suppliers or distributors.
- Sells products directly to customers.
- Delivers every sold product to the customer's selected destination.
- Supports cash/COD sales and store-provided credit.
- Can move products between stores.
- Can recover products through repossession and resell suitable recovered products.
- Is primarily demand-driven, while also operating showrooms that may hold display, showroom, or storage inventory.

Each store generally purchases independently, although stores may use the same distributors. New products are commonly acquired to fulfill customer demand, but a Purchase Order may also be created for general showroom or stock replenishment, which is expected to be less common.

### 1.3 Problems Being Solved

The system is intended to address:

- Fragmented paper-based records.
- Limited owner visibility across stores.
- Duplicate manual entry of operational and financial data.
- Weak traceability of individual physical products.
- Difficulty reconciling physical stock and cash against recorded balances.
- Difficulty tracking customer receivables, overdue installments, collections, and repossessions.
- Difficulty tracking supplier payables independently from product receiving.
- Limited auditability for approvals, negotiated prices, inventory losses, expenses, and cash custody.
- Difficulty preserving the full lifecycle of sold, recovered, repaired, replaced, lost, or scrapped products.

### 1.4 System Goals

**Confirmed.** The system will:

1. Maintain a reliable business source of truth.
2. Track every physical product unit individually and permanently.
3. Connect operational documents with related money movements without duplicating the underlying business event.
4. Support store-level operations and owner-level consolidated visibility.
5. Preserve historical records when rules, prices, classifications, or statuses change.
6. Support human decisions in credit approval, pricing, default, repossession, repair, product disposition, and resale.
7. Provide controlled reconciliation of physical stock and cash against system expectations.
8. Provide drill-down reporting from summaries to underlying business records.

### 1.5 Source-of-Truth Principle

**Confirmed.** The Management System is the business and management source of truth. Operational documents describe the underlying activity, while financial records describe the associated money movement. The same business information should not be repeatedly re-entered.

The Worker App is a separate employee-facing system. It consumes or exchanges relevant information with the Management System rather than becoming a second independent business database.

### 1.6 Relationship Between Stores and Owner

- Each store has its own operational and inventory scope.
- Normal store employees may only see their store's records.
- The owner and authorized management may view all stores or filter by a specific store.
- Each store receives a monthly operational budget from the owner.
- Managers handle normal operational decisions and spending.
- The owner is the approval authority for price-related negotiation, payroll approval, and additional budget or budget-overrun requests.
- The owner should be able to access consolidated information without asking each store to manually compile it.

## 2. Core Business Concepts

| Concept | Consolidated definition |
|---|---|
| **Product** | A product/model, answering “what is this?”, such as a particular television or sofa model. A Product may exist even when a store has no physical unit in stock. |
| **Product Code** | A system-generated identifier for a Product/model. |
| **Product Unit** | One individually tracked physical item, answering “which exact physical item is this?”. Every physical product, including furniture, is represented as a Product Unit. |
| **Product Unit ID / Internal Inventory ID** | A system-generated identifier permanently assigned to a physical Product Unit after receiving acceptance. It is distinct from a manufacturer serial number. |
| **Manufacturer Serial Number / IMEI** | A manufacturer-provided identifier recorded against applicable Product Units. It is not forced onto products that do not have or use one. |
| **Location** | Where a Product Unit physically is, such as a store showroom, store storage, customer, distributor, repair vendor, in transit, or disposed. |
| **Availability** | Whether a Product Unit may be allocated: Available, Reserved, or Unavailable. Availability is separate from location and history. |
| **Store** | An operational business location with its own inventory, sales, expenses, cash, staff, and data scope. |
| **Customer** | A person buying through cash/COD or store-provided credit. A customer may have multiple active credit purchases and a permanent payment/recovery history. |
| **Supplier / Distributor** | A party from which the store purchases products and to which supplier payables may be owed. The terms are used interchangeably in much of the source. |
| **Employee** | A permanent or freelance worker associated with a store and position who may perform sales, survey, collection, delivery, management, bookkeeping, or other eligible work. |
| **Sales Order** | The central commercial record. It begins with customer purchase intent and becomes the sale; no separate Sale document is created. |
| **Survey** | A separate credit-assessment record covering customer information, internal history checking, field verification, and managerial approval/rejection. |
| **Purchase Order** | The store's request to a supplier for products. It may fulfill one or more Sales Orders or, rarely, general stock/showroom needs. |
| **Inbound** | An inventory movement document for products entering a store inventory/location, including receiving, transfer-in, repossession, repair return, and warranty return. |
| **Outbound** | An inventory movement document for products leaving a store inventory/location, including customer delivery, transfer-out, warranty dispatch, repair dispatch, and scrap/disposal. |
| **Picking / Picking Note** | The store's physical execution and travel document for applicable Outbounds. In this business it includes preparation, loading, transportation, delivery, and customer confirmation. |
| **Delivery Note / Surat Jalan** | The physical business document accompanying delivery or transfer. The system also records the associated movement. |
| **Delivery** | An accountable event in which the store transports, sets up where applicable, presents the product for inspection, and obtains customer acceptance. |
| **Credit** | A store-provided installment arrangement for a specific purchase. A customer may have multiple credit contracts/schedules. |
| **DP** | Down payment paid upfront where required. DP is not included in the base price list and counts as money received. |
| **Payment** | Money actually received or paid. A customer payment is distinct from a collection visit, and a supplier payment is distinct from product receiving. |
| **Collection Visit** | An operational visit to collect money or obtain a payment commitment. A visit may produce no payment. |
| **Expense** | A paid operating cost. An immediate expense is paid at once, unlike a Bill that remains outstanding until payment. |
| **Budget** | The monthly operational funding allocated by the owner to a store for normal operations. |
| **Repossession** | A manager-authorized recovery of a product from an overdue customer after collection and warning attempts. |
| **Recovered Product** | A Product Unit returned to store inventory through repossession, customer cancellation after procurement, or another legitimate recovery scenario. “Recovered” is part of its history, not necessarily a permanent sale classification. |
| **Stock Opname** | A controlled physical inventory verification that compares expected Product Units with physically found Product Units. |
| **Money Holder / Custodian** | The person or place currently holding business money, such as Store Cash, owner, manager, accountant, or collector. |

## 3. Product & Inventory Management

### 3.1 Product Classification

**Confirmed.** Product and Product Unit are separate business concepts. A Product represents a model; a Product Unit represents one physical item.

The system separates three dimensions:

1. **Location:** where the unit physically is.
2. **Availability/allocation:** whether it is Available, Reserved, or Unavailable.
3. **Permanent history:** what has happened to the unit.

The source rejects a single simplistic condition status such as New, Used, Damaged, or Repaired. Instead, it distinguishes:

- Physical history.
- Current condition assessment.
- Current sale classification.

Condition and sale classification are determined by responsible staff rather than a universal formula.

### 3.2 Product Usage and Location

Locations may include:

- Store A or Store B.
- Showroom or storage within a store.
- Customer.
- Distributor/manufacturer.
- Repair vendor.
- In transit.
- Disposed.

**Confirmed.** Location is more useful than a dedicated ownership field for inventory tracking. Units sent for repair or warranty remain associated with their originating store while their physical location changes.

**Confirmed later baseline.** No separate “product usage/classification” field such as Normal Stock or Display Product is currently required. Showroom/storage location can describe the practical role. The source states that such a distinction may be added later only if the business proves it is needed.

### 3.3 Unit Identification

- Every physical product is individually tracked.
- Product Code is system-generated for the model.
- Product Unit ID is system-generated for the physical unit.
- Manufacturer serial number or IMEI is recorded separately where applicable.
- Product Unit ID is assigned and labelled after a distributor delivery is inspected and accepted.
- A repossessed or repaired unit retains its existing Product Unit ID.
- A manufacturer warranty replacement that is a different physical unit receives a new Product Unit ID linked to the replaced unit.
- Product Unit records are never deleted merely because the unit is sold, lost, replaced, scrapped, or disposed.

### 3.4 Inbound

Inbound represents physical products entering a store inventory/location. Types include:

- Distributor receiving.
- Inter-store transfer-in.
- Repossession inbound.
- Repair return.
- Warranty return.

A distributor delivery does not automatically become inventory. The boundary is successful inspection and acceptance. Accepted units create an Inbound/Receiving movement and enter active store inventory.

### 3.5 Outbound

Outbound represents physical products leaving a store inventory/location. Types include:

- Customer delivery.
- Inter-store transfer-out.
- Warranty dispatch.
- Repair dispatch.
- Disposal or scrap sale.

An Outbound is created for the actual delivery date or physical departure, not merely because a Sales Order exists.

### 3.6 Picking

**Confirmed.** Picking is not merged with Outbound.

- Outbound answers what should leave and why.
- Picking answers how and when the store physically executes applicable Outbounds.

In this store, Picking covers preparation/stuffing, loading, transport, delivery, customer inspection, and confirmation. One Picking may include many Outbound documents for multiple customers in one trip.

Normal Picking applies to customer delivery and to inter-store transfer when the store itself performs transportation. Warranty dispatch, repair dispatch, and scrap Outbounds do not use the normal Picking operation.

### 3.7 Product Movement and Inter-Store Transfer

Every physical movement must be traceable. A transfer is one business transaction with two inventory sides:

```text
Transfer Request
  -> Approval
  -> Source prepares
  -> Source Outbound / Dispatch
  -> In Transit
  -> Destination receives
  -> Destination verifies product, quantity, and condition
  -> Destination Inbound
  -> Completed
```

While in transit, the unit remains associated with the sender's inventory. It becomes part of the destination store's inventory only after successful receiving and verification.

A reserved Product Unit cannot be transferred to another store. The main transfer purpose is customer fulfillment; secondary use is inventory balancing when store capacity becomes constrained.

### 3.8 Stock Opname

**Confirmed workflow.** Stock opname verifies inventory but does not directly define or edit inventory.

- The system supplies expected Product Units.
- The manager and accounting/bookkeeping staff physically check units.
- Actual findings are recorded at unit level.
- Differences are flagged.
- Staff investigates relevant transactions and movement history.
- Any resolution occurs through a documented and authorized outcome.

**Confirmed latest baseline.** Stock opname has no fixed schedule and is not necessarily performed at month-end. Management initiates it when considered necessary because storage inventory rarely moves. The earlier statement requiring monthly/month-end stock opname is **superseded** by this later dedicated Stock Opname baseline.

### 3.9 Inventory Adjustment and Reconciliation

**Confirmed.** There is no generic “edit inventory,” “adjust inventory,” or casual “increase stock by one” function. A discrepancy follows:

```text
Discrepancy
  -> Investigation
  -> Determine cause
  -> Manager/authorized decision
  -> Controlled resolution
  -> Preserved audit trail
```

Specific outcomes include:

- Recording error: correct the incorrect transaction or movement record.
- Confirmed lost/stolen: mark the Product Unit Lost, remove it from active inventory, retain history, and expose the loss to bookkeeping/management.
- Damaged but usable: it may remain physical inventory and be used as display inventory.
- Damaged and unusable: dispose or sell to a scrap dealer through an Outbound movement.

Every discrepancy resolution should conceptually record the reason, explanation, Product Unit, recorder, approver, date/time, related stock-opname session, and related transaction/movement where applicable.

**Open Question.** It is undecided whether every discrepancy requires manager approval or only confirmed losses and high-value cases.

### 3.10 Lost, Damaged, Scrap, and Disposed Products

- Lost or stolen Product Units remain permanently recorded and represent a business loss.
- Damaged but usable units may become display products and remain countable inventory.
- Unusable units may be sold to a scrap dealer.
- Scrap sale is a legitimate inventory disposition, not deletion.
- Scrap proceeds and any related cost must be retained as financial facts.
- Management should be able to determine what happened to every recovered or disposed Product Unit.

### 3.11 Display Products

Display/demo products are physical inventory and must be countable. They may be non-functional and normally are not sellable, particularly for electronics.

The later lifecycle baseline also states that a display product can be sold if usable and does not require a permanent separate display classification. Therefore:

- **Confirmed:** Physical inventory is not the same as sellable inventory.
- **Confirmed:** Showroom/display units remain traceable and countable.
- **Confirmed latest baseline:** No separate permanent display classification is required. A showroom/display unit may be sold if responsible staff determines it is usable; otherwise it remains unavailable for sale. The earlier broad statement that display units are normally not sellable is treated as general context, not an absolute rule.

### 3.12 Reservation

- A specific Product Unit becomes Reserved as soon as the customer verbally confirms they want it.
- Payment or DP is not required to create a reservation.
- A customer may reserve multiple units.
- There is no arbitrary reservation expiry.
- Reservation is an allocation, not a physical lock; the unit may move internally from showroom to storage without losing reservation.
- Reserved units cannot be allocated to another customer or transferred to another store.
- Reservation ends on delivery, credit rejection, customer cancellation/release, Sales Order cancellation, or another legitimate release event.
- A customer may change to another unit if the new unit is not reserved for someone else.
- If the reserved unit is defective before delivery, the store informs the customer and substitutes another suitable unit.

**Ambiguous terminology/authority.** The source says reservation release/change is controlled by the “surveyor/customer according to the situation.” The exact authority, role meaning, and approval rule are not clarified.

## 4. Sales & Customer Management

### 4.1 Customer

A customer may purchase by cash/COD or credit. The system retains identity, contact, address, employment/business, financial/lifestyle information where collected, purchase history, payment history, outstanding balances, defaults, and repossessions.

A customer with a previous default or repossession is not permanently blocked from future credit. The system warns the surveyor/manager, who may require a deeper reassessment.

### 4.2 Sales Order

**Confirmed.** The Sales Order is the central commercial record and becomes the sale. No separate Sale document is created.

It includes the customer, requested products and quantities, prices, negotiation, payment method, DP, credit period, installments, survey relationship, reservation, and delivery relationship.

A Sales Order may exist before money is received. Its items progress independently. Some items may be delivered, pending procurement, or cancelled while others continue.

The Sales Order is completed only when the entire financial obligation has been fulfilled. Physical delivery completion is separate from financial completion.

### 4.3 Credit Survey

For a new credit customer:

1. Salesperson interviews the customer, checks ID, collects customer and purchase information, and gathers relevant financial/lifestyle information.
2. Accountant/financial staff checks previous purchases, existing credit, payment history, outstanding balances, defaults, and repossessions.
3. Surveyor, usually the store manager or a designated surveyor, visits the residence and workplace to verify information.
4. Manager makes the final approval or rejection using managerial judgment.

There is no automated credit score that determines approval.

Existing good/loyal customers do not normally need a full survey for every purchase. Reassessment may occur for materially larger purchases, problematic history, previous default, substantially different obligations, or when the manager considers it necessary.

There is no formal customer-level credit limit. Approval is made for the specific purchase and expected installment obligation.

### 4.4 Negotiation

Normal selling prices use the store price list. Rare negotiation is permitted for loyal/valuable customers or exceptional cases.

Price-related negotiation requires owner approval and preserves:

- Original/standard price.
- Proposed or negotiated price.
- Final agreed price.
- Requester.
- Approver.
- Reason and audit history.

The same principle applies independently to supplier purchase-price negotiation.

### 4.5 Pricing

**Confirmed later pricing baseline.** Standard periods are Cash, 10 months, 12 months, and 15 months. Other periods may be calculated only as a customer request/negotiation and are not automatically approved.

- HD/base price is fixed from the selected product.
- Electronics and furniture use different configurable DP brackets.
- The source refers to an agreed generalized price formula but does not reproduce the formula in the provided material.
- Final calculated prices are rounded to the nearest Rp1,000.
- The system is expected to support a Price List Generator and Credit Price Calculator.
- Approved prices and terms are stored on the Sales Order so later price-list changes do not alter existing sales.
- Price lists are versioned.
- Furniture price lists are grouped by distributor/vendor; electronics price lists may be combined.

**Confirmed latest baseline.** Standard options are Cash, 10 months, 12 months, and 15 months. The earlier Cash, 6, 12, and 15-month statement is **superseded** by the later locked pricing baseline.

### 4.6 Down Payment

- DP is not included in the base price list.
- DP is configurable and may be adjusted during price calculation/negotiation.
- Expensive products may require mandatory DP according to configurable product pricing rules.
- Required DP must be paid fully upfront.
- DP counts as money received.
- A credit purchase becomes committed after credit approval and payment of the required DP.

**Open Question / incomplete source detail.** Earlier discussion states the exact parameter determining which products require DP was not established. Later discussion mentions category-specific configurable DP brackets, but the actual brackets and formula are not present.

### 4.7 Cash and COD Sales

For cash purchases, no credit background survey is required. Payment occurs through COD after delivery, inspection, and acceptance:

```text
Product delivered
  -> Customer inspects
  -> Customer accepts
  -> Customer pays
  -> Delivery confirmed
```

The Sales Order becomes financially realized when the COD payment is received.

### 4.8 Credit Sales

A credit customer may choose the approved payment period. Credit approval is based on the specific purchase, not a formal general credit limit. The credit price represents the chosen payment term, with no additional interest, late fee, or credit fee.

A customer may have multiple active credit purchases simultaneously. They are separate obligations/schedules under the same customer profile and aggregate customer-level receivable view.

### 4.9 Installments and Payments

- The financed amount is divided into agreed installments.
- Payment structure is normally fixed.
- Final rounded amounts must reconcile exactly to the customer's obligation.
- Partial installment payments are permitted.
- Installment state cannot be represented only as Paid/Unpaid; Due, Partial, and Paid must be distinguishable, with overdue tracked separately.
- No late fees, automatic penalties, or automatic repossession apply.
- A promised payment date does not change the original due date or erase overdue status.

**Confirmed latest baseline.** Each Sales Order item generates its installment schedule from that item's actual delivery date. A single Sales Order may therefore contain multiple installment schedules. The earlier rule using the first successfully delivered item as the common schedule date is **superseded**.

### 4.10 Payment Allocation

**Confirmed latest baseline.** A customer payment does not need to identify a specific credit. The system allocates it internally using a reasonable prioritization rule, with older and/or lower outstanding obligations identified in the latest finance discussion as the intended basis. The earlier detailed oldest-installment-first sequence and excess/customer-credit example provide historical context but are not retained as a stricter rule than the latest wording.

**Open Question.** The exact prioritization order, tie-breaking behavior, and treatment of any remaining excess require final business definition.

### 4.11 Sales Cancellation

A Sales Order may be cancelled because of customer cancellation, credit rejection, sourcing failure, or another legitimate reason. Individual items may be cancelled while the rest of the order continues.

Reservation is released when the relevant order/item no longer proceeds. If the store already purchased a unit specifically for the customer, cancellation may cause the unit to become recovered inventory available for inspection, reassignment, or resale according to applicable rules.

## 5. Purchase & Supplier Management

### 5.1 Supplier / Distributor

The system retains supplier/distributor information and product relationships. A product may be associated with multiple suppliers and supplier costs may differ.

### 5.2 Purchase Order

A PO represents the store's request to obtain products. It may:

- Fulfill one or more Sales Orders.
- Serve multiple customers.
- Be created without a Sales Order for general showroom/stock needs, though this is expected to be rare.

The PO records agreed supplier purchase cost. If the supplier communicates a price change and the store agrees, the PO may be changed to the new agreed cost with appropriate history.

### 5.3 Partial Delivery and Acceptance

A receiving may accept correct items and reject incorrect or damaged items. Rejected items are taken back by the supplier and never enter normal store inventory.

### 5.4 Multiple Deliveries

One PO may be fulfilled by multiple deliveries and Inbound documents. Each delivery is independently received and inspected. The PO remains partially received until expected quantities are fulfilled or otherwise resolved.

### 5.5 Inbound Receiving

**Trigger:** Supplier delivers products against a PO.  
**Actors:** Manager or accounting/bookkeeping staff; supplier/distributor.  
**Action:** Compare models, quantities, and physical condition against the PO; accept correct units and reject problematic units.  
**Result:** Accepted units receive Product Unit IDs and become store inventory; rejected units return with the supplier.  
**Status change:** PO may become partially received or completed; accepted delivery creates Inbound/Receiving.  
**Related documents/data:** PO, supplier delivery/receiving document, Inbound, Product Units, manufacturer serial numbers.

### 5.6 Supplier Payable

Goods receiving and supplier payment are independent. Inventory may already belong to the store while part or all of the supplier obligation remains unpaid. Supplier payments may cover multiple POs.

### 5.7 Supplier Payment

Supplier collectors may visit weekly, monthly, or another agreed interval. Collection is generally supplier-level rather than tied to one PO. The internal allocation of a payment may cover multiple outstanding obligations.

### 5.8 Giro / Check

The normal supplier payment method is giro/check. The lifecycle is:

```text
Outstanding
  -> Payment/Giro prepared
  -> Given to supplier collector
  -> Clearing
  -> Paid
```

The payable becomes Paid only after successful clearing. If the giro/check fails or bounces, the outstanding obligation remains or is restored.

**Confirmed latest baseline.** The system records the supplier, store, date, amount, method, status, and related business context without requiring excessive banking detail. The earlier suggestion to require a giro/check reference is **superseded** unless the business later proves that reference detail is necessary.

## 6. Delivery & Logistics

### 6.1 Outbound

Outbound records the product physically leaving the store. It is created for actual delivery execution, not merely when the customer places an order.

### 6.2 Picking

One Picking Note may execute multiple customer Outbounds in one trip. Partial delivery is supported; remaining outbound items may be fulfilled by later Pickings. The Outbound remains incomplete until all required items have been successfully delivered.

### 6.3 Delivery Document

Every physical delivery or transfer uses a Delivery Note/Surat Jalan. The Picking Note is the driver's operational travel document and may include several Outbounds.

### 6.4 Driver and Helper

The standard delivery or repossession team is Driver plus Helper. The driver may work alone if the product can be safely handled by one person. Picking should eventually capture driver, helper(s), vehicle, trip date/time, Outbounds, products, destinations, sequence, verification, signatures, and issues, although exact fields are a later design decision.

### 6.5 Pre-Delivery Inspection

Manager, driver, and helper inspect the product before departure and agree that it is in acceptable condition. This establishes accountability for damage occurring during delivery.

### 6.6 Customer Inspection and Installation

The delivery team transports and carries the product, performs applicable setup/installation, and verifies basic functionality. Installation is limited to the purchased product and excludes unrelated services such as antenna or set-top-box installation.

The customer checks the correct product, physical condition, basic functionality, and setup.

### 6.7 Delivery Confirmation

If satisfied, the customer signs the delivery confirmation/receipt. Successful delivery occurs only when the product arrives, is inspected, and is accepted/signed. The actual successful delivery date is recorded.

A delivered and accepted unit leaves active store inventory but remains permanently searchable.

### 6.8 Delivery Problem or Damage

If the customer identifies a problem before acceptance, delivery remains incomplete. The manager investigates the driver/helper because the condition was confirmed before departure. Delivery-caused damage is the store's responsibility and is repaired or replaced by the store; it is not a manufacturer warranty claim.

### 6.9 Partial Delivery

Sales Order items may progress and be delivered independently. Outbound items not delivered remain pending and may be included in a later Picking.

### 6.10 Failed Delivery

The store normally calls ahead, so failed deliveries are expected to be rare. An unsuccessful attempt is rescheduled. No complex failed-delivery workflow is required at this stage.

## 7. Warranty & Return

### 7.1 Warranty Responsibility

- The store manages the customer relationship and coordinates the warranty process.
- The manufacturer/distributor owns the technical assessment and determines whether the defect is covered.
- A valid manufacturing/factory defect within the applicable warranty period is covered.
- Customer-caused damage, misuse, impact, dropping, or water damage is not covered.
- Warranty terms and periods vary by product, brand, or distributor arrangement and are not globally hardcoded.
- For valid claims, the manufacturer/distributor bears applicable warranty costs.

### 7.2 Warranty Claim Workflow

**Trigger:** Customer reports a problem after successful delivery acceptance.  
**Actors:** Customer, store staff, manufacturer/distributor.  
**Action:** Store records complaint, verifies purchase and warranty-period eligibility, coordinates contact and movement, and tracks the manufacturer's assessment.  
**Result:** Repair, same-model replacement, or rejected warranty.  
**Status change:** Warranty Claim progresses through submission, assessment, outcome, return, and completion.  
**Related documents/data:** Customer complaint, Warranty Claim, Product Unit, serial number, Inbound/Outbound movements, manufacturer decision.

### 7.3 Manufacturer Involvement

The manufacturer/distributor inspects the product and decides the outcome. Under the latest warranty baseline, the store manages and tracks the warranty process while the manufacturer/distributor owns the technical assessment and may contact the customer directly. Physical product movement may still pass through the store: Customer -> Store -> Manufacturer/Distributor -> Store -> Customer. The earlier wording that positioned the store as the primary technical intermediary is superseded by the later clarification that the manufacturer handles technical assessment and direct customer contact where applicable.

### 7.4 Warranty Outcomes

- **Repair:** Same Product Unit ID is retained and repair history is added.
- **Replacement:** Same model; a different physical replacement gets a new Product Unit ID linked to the old unit.
- **Rejected:** Manufacturer's decision is recorded. Customer may receive the product back as-is or authorize paid repair if offered.

Temporary or loaner replacement is optional and case-dependent, not part of the normal mandatory warranty workflow.

### 7.5 Product Return

**Confirmed final baseline.** There is no generic Customer Return Document or normal unrestricted return process.

- Before delivery acceptance: customer may reject the product; delivery remains incomplete and the product goes back to the store as part of the delivery workflow.
- After successful acceptance: the meaningful product-return movement is normally part of a Warranty Claim.
- Change-of-mind return is not a normal business case.
- Store mistake is resolved by the store through correction/replacement.
- Other exceptional cases are decided by management.

### 7.6 Customer Responsibility After Acceptance

Once the customer has inspected and signed the delivery confirmation, the product is considered delivered and accepted without delivery-related damage. Later manufacturing problems follow warranty. Customer-caused damage is not covered, though paid repair may be offered.

## 8. Repossession

### 8.1 Trigger

Repossession may begin when:

- Customer is overdue.
- Collection and warning/contact attempts have occurred.
- Manager determines repossession is necessary.

There is no automatic trigger based only on elapsed overdue days or number of missed installments. Approximately one month may be tolerated, but this is not an automatic rule.

### 8.2 Repossession Workflow

**Trigger:** Manager decides recovery is necessary after overdue collection and warning.  
**Actors:** Manager, driver, helper where needed, customer.  
**Action:** Create Repossession Document, schedule visit, recover the specified Product Unit(s), and return them to the store.  
**Result:** Successful recovery or failed/refused attempt.  
**Status change:** Credit becomes settled through repossession after successful recovery; Product Unit becomes Recovered and Unavailable pending inspection.  
**Related documents/data:** Customer, Sales Order/credit, Product Unit, collection and warning history, Repossession Document, Inbound movement.

If the customer refuses, the attempt and result are recorded. Court/legal proceedings are outside system scope.

### 8.3 Product Recovery

The existing Product Unit ID is retained. The recovery creates a repossession Inbound movement. The Product Unit remains Unavailable until inspection and disposition are complete.

### 8.4 Product Condition

Inspection is product-specific and based on human judgment. Furniture may be checked for material, holes, stains, tears, structure, appearance, and usability. Electronics may be checked for power, display, ports, remote, accessories, box, physical damage, and functionality.

No universal condition formula is used.

### 8.5 Recovered Product Handling

Three confirmed outcomes exist:

1. **Sell as-is:** usable and no repair required; make Available for resale.
2. **Repair then sell:** external distributor/vendor inspects; repair fee is agreed per case; repair occurs; store verifies return condition; unit may become Available.
3. **Dispose/scrap:** not economically repairable or resellable; may be sold to a scrap dealer and generate proceeds.

Repair vendor, request, result, agreed cost, status, completion, and final condition are retained. Resale price is manually entered by authorized staff. There is no hardcoded depreciation or condition-percentage formula.

A previously recovered product may be commercially classified and sold according to current condition while its recovery history remains. Electronics generally require appropriate original box/completeness before being represented as new. Furniture may be treated more practically if it looks good and is usable.

### 8.6 Financial Impact

After successful repossession:

- Remaining customer balance is cancelled/forgiven and becomes zero.
- Previously paid money is not refunded.
- Complete payment history remains.
- The credit is represented as settled through repossession, not normally paid.
- Raw facts are retained: supplier cost, customer payments, forgiven amount, repair cost, scrap proceeds, and eventual resale price.

**Open Question.** Exact accounting treatment and recovered-product cost basis are not finalized.

## 9. Employee & Payroll Data

### 9.1 Employee Types and Positions

Employees may be permanent or freelance and are associated with a position and store. Commission eligibility is activity-based where applicable, not restricted solely by job title.

### 9.2 Salary

Employees may have base salary, position commission, sales commission, collection commission, meal allowance, and fuel allowance. Salary and commission are normally paid together at month-end.

### 9.3 Commission

- A sale becomes eligible for sales commission after the customer's first payment.
- A successful installment collection may generate collection commission.
- An employee performing an eligible activity may earn the associated commission.
- Commission appears to use target/bracket rules.

### 9.4 Sales Targets

The system/Worker App relationship is expected to support sales targets, but exact target definitions and formulas are not provided.

### 9.5 Collection Targets

Collection activities may contribute to collection commission and targets. Exact target and bracket rules remain pending actual business data.

### 9.6 Meal Allowance

Meal allowance is part of payroll data. Exact eligibility, amount, and formula are not defined.

### 9.7 Payroll Approval

```text
Employee activity + HR data
  -> Manager collects and verifies payroll data
  -> Owner gives final approval
  -> Payroll paid
  -> Financial expense recorded
```

### 9.8 Worker App Relationship

The Worker App displays employee-facing information such as attendance, payroll, commission, targets, leave, work plans, and assigned tasks. Attendance is expected to come from a biometric/fingerprint device.

The Management System remains the business/management source of truth. HR remains responsible for HR-specific source data. Work assignments may flow from the Management System to the Worker App, and completion/results return to the Management System.

## 10. Expenses & Operational Budget

### 10.1 Store Operational Budget

Each store receives a monthly operational budget from the owner. The system tracks allocation, amount spent, remaining amount, spending by category, and additional budget requests/approvals.

### 10.2 Expense

Normal workflow:

```text
Staff needs funds
  -> Request to manager/accountant
  -> Expense occurs
  -> Receipt/proof obtained
  -> Expense recorded
  -> Manager verifies
```

Typical categories include electricity, water, pickup fuel, rent, repairs, and other operating expenses. Expenses may be recurring or one-off. Rent may follow annual, two-year, or other agreement periods and must not be assumed monthly.

Expense records include store, date, category, description, amount, payee/vendor, requester/recorder, payment method, related budget, proof, and verification/approval status.

### 10.3 Bills

A Bill represents an obligation received now and paid later. An immediate Expense is paid when incurred. Both become financial records, but a Bill has an outstanding period and payment lifecycle.

### 10.4 Receipts

**Confirmed.** Every expense requires receipt or supporting proof. Digital documents are stored when available; otherwise staff attach a photo.

### 10.5 Budget Overrun

Budget is not a hard technical spending block. If an expense exceeds available budget, the system requires additional-budget/owner approval rather than preventing the expense from being recorded.

### 10.6 Owner Approval

The owner does not approve every normal expense. The manager normally verifies/approves routine spending. Owner approval is required for additional budget or budget-overrun escalation.

Shared expenses are not currently a significant requirement; expenses belong to individual stores.

## 11. Cash & Money Movement

### 11.1 Store Cash

Stores do not have dedicated store bank accounts. Business money may be held as physical store cash or in personal accounts belonging to the owner or authorized staff.

### 11.2 Owner Funding

The owner normally transfers operational funding by bank transfer. The system records the business movement into store operational funds even when the source account is personally held by the owner.

### 11.3 Staff-Held Money

Customer money may temporarily be held by a collector or another authorized member of staff, including in the employee's bank account. The system tracks the current holder and pending handover status.

Account holder is not the same as business ownership/context.

### 11.4 Customer Collections

The system separates:

- Collection assignment.
- Collection visit.
- Customer payment.
- Collector-to-cashier/store settlement.

A customer may pay cash or by another supported method. The system should not be unnecessarily restricted to cash.

### 11.5 Cashier Handover

After a collector receives money, it is later handed or settled to the store cashier. This handover is separately traceable so the owner can distinguish:

- Customer has paid.
- Collector currently holds the money.
- Store/cashier has received the money.

### 11.6 Cash Reconciliation

Stores perform physical cash counts:

```text
Expected system cash
  -> Physical cash count
  -> Difference identified
  -> Investigation
  -> Documented explanation/adjustment
```

Original transactions are not silently edited to force agreement.

No major inter-store money-transfer workflow is currently required.

## 12. Financial Reporting

### 12.1 Purpose and Boundaries

The financial layer provides accurate operational financial records and management visibility. It is not currently intended to be a full accounting application.

Explicitly not yet defined:

- Double-entry accounting.
- General ledger.
- Journal entries.
- Tax accounting.
- Bank reconciliation.
- Depreciation.
- Standards-compliant financial statements.

### 12.2 Sales

Sales represents the value of completed sales/commercial obligations. A Sales Order can exist before money is received, and delivery does not by itself mean the customer has paid in full.

### 12.3 Cash Received

Cash received means money actually collected, including COD, DP, and installments. It must be reported separately from sales value and outstanding receivables.

### 12.4 Customer Receivables

Reports should show total customer outstanding balance, overdue amount, upcoming payment, payment history, and underlying credit/installment detail. Customers may have multiple simultaneous credit obligations.

### 12.5 Supplier Payables

Reports should distinguish total purchases/received value, amounts paid, amounts clearing, and outstanding supplier obligations. Receiving and supplier payment statuses remain independent.

### 12.6 Expenses and Payroll

Reports cover expenses by category/store/period, bills outstanding and paid, payroll, salary, commissions, allowances, operational budgets, budget consumption, and additional approvals.

### 12.7 Cash Position

The system reports expected cash, physical count differences, funding movements, current custody, and money held by staff.

### 12.8 Gross Margin

Selling price minus supplier purchase cost is a gross margin, not necessarily final profit. Repair costs and other relevant costs may affect management analysis.

### 12.9 Management-Level Profitability

The system may provide estimated management-level profitability based on available operational facts. It must not label this as official accounting profit until accounting rules are designed.

### 12.10 Owner Dashboard

The owner should be able to see sales, customer payments, purchases, supplier payments, salaries, commissions, bills, expenses, budgets, cash position, discrepancies, staff-held money, and financial alerts.

### 12.11 Multi-Store Reporting

Reports can be filtered for all stores, one store, and specified date/time periods. Store staff remain restricted to their store; owner/authorized management can aggregate across stores.

### 12.12 Drill-Down and Exports

All summary figures should be drillable to their underlying business records. Reports should eventually support PDF, Excel, and CSV export.

## 13. Cross-System Rules

### 13.1 Source of Truth

- Digital records replace/support paper workflows.
- The Management System is the business/management source of truth.
- Operational records originate the business event; financial records represent related money movement.
- Duplicate entry should be avoided.

### 13.2 Approval Principles

- Manager decides credit approval, reassessment, default, repossession, recovered-product disposition, and repair/resale decisions.
- Owner approves price-related negotiation, payroll, and additional budget/budget overrun.
- Destination staff/manager verifies inter-store transfer receipt.
- Manager or accounting staff verifies distributor receiving.
- Stock and cash discrepancies require investigation before controlled resolution.

### 13.3 Auditability

The system preserves requester, approver, reason, before/after values, dates, relevant staff, source documents, movement history, payment history, and supporting proof where applicable.

### 13.4 Document Status and Completion

Different documents complete at different business boundaries:

- Sales Order: entire financial obligation settled.
- Outbound/Delivery/Picking: physical delivery and customer acceptance completed.
- PO: expected quantities fulfilled or otherwise resolved.
- Supplier payable: payment successfully cleared.
- Warranty Claim: manufacturer outcome tracked and product/customer handback completed.
- Repossession: recovery result recorded; successful recovery leads to financial settlement through repossession and inspection workflow.

### 13.5 Cancellation

Cancellations are recorded, not deleted. Sales Order items can be partially cancelled. Cancellation releases reservations and may leave customer-specific procured units as recovered/reassignable inventory.

### 13.6 Historical Data Preservation

- Product Units are never deleted from history.
- Sold, replaced, repossessed, repaired, lost, or scrapped units remain searchable.
- Payment and repossession history remains visible.
- Version changes do not rewrite historic sales, payroll, price lists, or rule results.

### 13.7 Configurable Business Rules

Pricing, DP brackets, commission brackets/formulas, position commission, meal allowance, and other payroll rules must be configurable and versioned by effective period rather than hardcoded.

### 13.8 Store Scope

Each store retains its own inventory and operating records. Store staff see only their store. Owner/authorized management sees all stores or filters by store.

### 13.9 User and Role Permissions

The source establishes several approval actors but does not finalize the complete permission hierarchy. Role names and exact access rights remain an explicitly open design area.

### 13.10 System Warns, Manager Decides

The system must provide warnings, history, and facts rather than automatically determining:

- Credit approval.
- Customer reassessment.
- Default.
- Repossession.
- Negotiated pricing approval.
- Product repair viability.
- Recovered-product resale price/classification.

## 14. End-to-End Workflows

### 14.1 Customer Purchase Workflow

**Trigger:** Customer expresses interest in buying a product.  
**Actors:** Customer, salesperson, accountant, surveyor, manager, supplier, receiving staff, driver/helper, cashier/collector.  
**Result:** Product delivered and accepted; financial obligation tracked until settlement.  
**Related documents:** Sales Order, Survey if credit, PO if required, Inbound, Outbound, Picking Note, delivery confirmation, payment/credit records.

1. Sales staff creates a Sales Order.
2. Specific available Product Unit may be reserved on verbal confirmation.
3. For credit, staff performs the Survey and manager approves or rejects.
4. Standard or negotiated price, payment method, period, and DP are finalized; price negotiation requires owner approval.
5. If no suitable unit is available, create a PO linked to one or more Sales Orders.
6. Supplier delivers; manager/accountant inspects and accepts/rejects.
7. Accepted units enter inventory through Inbound and receive Product Unit IDs.
8. On delivery date, create Outbound.
9. Assign Outbound(s) to a Picking Note/trip.
10. Team inspects before departure, loads, transports, and installs where applicable.
11. Customer inspects and either rejects before acceptance or signs confirmation.
12. Cash/COD customer pays after acceptance; credit customer continues according to the agreed obligation.
13. Delivery documents complete after physical acceptance.
14. Sales Order remains active until the financial obligation is fully settled or settled through an approved alternative such as repossession.

### 14.2 Purchase and Receiving Workflow

**Trigger:** Customer demand or exceptional stock/showroom need.  
**Actors:** Store staff, supplier, manager/accountant.  
**Status change:** PO Open -> Partially Received -> Completed/Resolved.

1. Create PO and link applicable Sales Orders.
2. Record agreed supplier cost.
3. Supplier makes one or more deliveries.
4. Compare each delivery with the PO.
5. Accept correct units and reject incorrect/damaged units.
6. Sign supplier receiving document for accepted items.
7. Create Inbound/Receiving.
8. Assign Product Unit IDs and record serial numbers where applicable.
9. Update PO receiving progress independently from supplier payment progress.

### 14.3 Supplier Payment Workflow

**Trigger:** Outstanding supplier obligation and supplier collector/payment schedule.  
**Actors:** Store finance staff, supplier collector, bank/clearing process.  
**Status change:** Outstanding -> Prepared -> Given -> Clearing -> Paid or Failed.

1. Review supplier-level outstanding obligations.
2. Prepare giro/check or other agreed payment.
3. Record amount, supplier, store, date, method, and related context.
4. Hand payment instrument to supplier collector.
5. Await clearing.
6. On success, mark allocated payable amounts Paid.
7. On failure/bounce, retain or restore outstanding amounts.

### 14.4 Delivery Workflow

**Trigger:** Product is ready and delivery is scheduled.  
**Actors:** Manager, driver, helper, customer.  
**Status change:** Reserved/Store -> Outbound/In Transit -> Customer/Accepted, or delivery remains incomplete.

1. Create Outbound for items scheduled to leave.
2. Add applicable Outbounds to Picking Note.
3. Manager and delivery team inspect the products.
4. Prepare/load vehicle and travel to actual destination.
5. Install/setup purchased product where applicable.
6. Customer inspects product and functionality.
7. If accepted, customer signs and actual delivery date is recorded.
8. If damage/problem is found, delivery remains incomplete; manager investigates and store repairs/replaces delivery-caused damage.
9. If destination is unavailable, reschedule.

### 14.5 Customer Collection Workflow

**Trigger:** Upcoming or overdue customer payment.  
**Actors:** Assigned staff member, customer, cashier.  
**Status change:** Visit planned -> Visited -> payment received or promise/no payment -> collector-held -> handed to cashier.

1. Assign a suitable staff member based on geographic convenience.
2. Record visit to home, workplace, or appropriate location.
3. If payment is received, record customer payment and handwritten kwitansi reference.
4. Allocate payment according to the agreed allocation rule.
5. If less than due, retain Partial and overdue information.
6. If no payment, record result, notes, and promised payment date without changing original due date.
7. Record warning/contact attempts where applicable.
8. Track money held by collector.
9. Record collector-to-cashier/store handover.

### 14.6 Warranty Claim Workflow

**Trigger:** Customer reports a post-acceptance product problem.  
**Actors:** Customer, store, manufacturer/distributor.  
**Status change:** Complaint -> eligibility checked -> submitted -> assessed -> repaired/replaced/rejected -> returned/completed.

1. Record customer complaint separately from manufacturer determination.
2. Verify purchase/unit identity and applicable warranty period.
3. Contact manufacturer/distributor and coordinate customer communication.
4. Track physical custody using Inbound/Outbound as needed.
5. Manufacturer inspects and decides repair, same-model replacement, or rejection.
6. Preserve Product Unit ID for repair; create and link new Product Unit for physical replacement.
7. Return product/result to customer and close the claim.

### 14.7 Repossession Workflow

**Trigger:** Continued non-payment after collection/warning and manager decision.  
**Actors:** Manager, driver/helper, customer, inspection staff.  
**Status change:** Overdue -> Repossession authorized -> recovered/refused -> settled through repossession -> inspection -> resale/repair/scrap.

1. Record collection and warning history.
2. Manager decides whether to continue collection, give more time, or repossess.
3. Create and approve Repossession Document.
4. Assign driver and helper as needed.
5. Attempt recovery and record actual result/date.
6. On success, create repossession Inbound; retain Product Unit ID.
7. Cancel remaining customer balance, retain previous payments, and preserve history.
8. Mark Product Unit Unavailable and inspect.
9. Decide sell as-is, external repair then sell, or scrap/dispose.
10. Authorized staff manually determines resale price if sold.

### 14.8 Expense and Budget Workflow

**Trigger:** Store operational spending need.  
**Actors:** Staff, manager/accountant, owner for exceptions.  
**Status change:** Requested/incurred -> proof attached -> manager verified -> paid, or additional budget pending/approved.

1. Staff requests/uses funds through manager/accountant.
2. Expense occurs or Bill is recorded.
3. Attach mandatory receipt/proof.
4. Record store, category, amount, payee, method, and budget context.
5. Manager verifies normal expense.
6. If over available budget, request additional budget.
7. Owner approves or rejects escalation.
8. Update budget spent/remaining and financial records.

### 14.9 Payroll Workflow

**Trigger:** Month-end payroll cycle.  
**Actors:** Manager, HR/source systems, owner, employee.  
**Status change:** Payroll prepared -> verified -> owner approved -> paid.

1. Obtain employee, attendance, activity, salary, target, commission, and allowance data.
2. Apply effective versioned rules.
3. Manager collects and verifies payroll data.
4. Owner gives final approval.
5. Pay salary and commission together where applicable.
6. Record payroll as financial expense and expose employee-facing result through Worker App.

### 14.10 Stock Opname Workflow

**Trigger:** Management decides physical inventory verification is required; there is no fixed schedule.  
**Actors:** Manager and accounting/bookkeeping staff.  
**Status change:** Started -> counting -> discrepancy/no discrepancy -> investigation -> controlled resolution -> completed.

1. Start session and obtain expected unit-level inventory.
2. Physically scan/check each Product Unit.
3. Record found/not-found and unexpected observations.
4. Compare physical findings with system records.
5. Complete if no difference.
6. If difference exists, investigate transaction and movement history.
7. Determine recording error, loss, damage/display, or scrap outcome.
8. Obtain required approval and document resolution.
9. Preserve original history and complete the session.

### 14.11 Cash Reconciliation Workflow

**Trigger:** Regular physical cash count.  
**Actors:** Store cashier/finance staff and responsible manager.  
**Status change:** Expected -> counted -> matched or discrepancy -> investigated -> explained/adjusted.

1. Calculate expected cash from recorded movements.
2. Count physical cash.
3. Compare expected and actual amounts.
4. Investigate differences, including staff-held or pending handover amounts.
5. Record explanation and authorized resolution without rewriting original transactions.

## 15. Confirmed Decisions

1. The Management System is the business/management source of truth.
2. Every physical product is tracked as a permanent Product Unit.
3. Product Code and Product Unit ID are system-generated; manufacturer serial is separate and optional by product applicability.
4. Location, Availability, and History are separate dimensions.
5. Products enter inventory only after receiving inspection and acceptance.
6. Business transactions and inventory movements are distinct but linked.
7. Inbound and Outbound are top-level inventory movement concepts.
8. Picking is separate from Outbound, and one Picking can execute multiple Outbounds.
9. Reservations begin on verbal customer confirmation without requiring payment or DP and have no arbitrary expiry.
10. Sales Order is the sale record; no separate Sale document exists.
11. Sales Order completion requires full financial settlement, not merely delivery.
12. Managerial judgment controls credit approval, default, repossession, and recovered-product decisions.
13. Customer payments may be partial; overdue does not automatically mean default.
14. No late fees, automatic penalties, or automatic repossession apply.
15. Customer payments need not identify a specific credit and are allocated internally using the latest reasonable-prioritization principle; exact ordering remains open.
16. Successful repossession cancels the remaining balance while retaining prior payments and full history.
17. Recovered products may be sold as-is, repaired externally then sold, or scrapped/disposed.
18. Recovered resale price is manually determined; no automatic depreciation formula applies.
19. The store coordinates warranty; manufacturer/distributor makes the technical warranty decision.
20. Valid warranty outcomes are repair, same-model replacement, or rejection.
21. There is no generic unrestricted customer return process/document.
22. Every sold product is delivered by the store and requires customer inspection/acceptance.
23. Delivery-caused damage is the store's responsibility and is not a warranty claim.
24. Supplier receiving and supplier payment are independent.
25. Giro/check is Paid only after successful clearing.
26. Each store receives a monthly operational budget; normal expenses are manager-controlled and overruns escalate to owner approval.
27. Every expense requires receipt/proof.
28. Stores do not have dedicated bank accounts; current money holder/custody is tracked.
29. Collector-held customer money and cashier handover are separately traceable.
30. Stock and cash discrepancies are investigated rather than silently overwritten.
31. Pricing, commission, allowance, and similar rules are configurable and versioned.
32. Store staff see store-scoped data; owner/authorized management can see all stores.
33. Reports distinguish Sales, Cash Received, Receivables, and Profitability.
34. Summary reports are drillable to source records and should eventually support PDF/Excel/CSV export.

## 16. Open Questions

Only items explicitly left pending or incomplete in the source are listed here.

1. Exact customer-payment allocation priority, tie-breaking, and excess-payment treatment.
2. Exact installment reconciliation behavior where schedules or rounding create edge cases.
3. Exact accounting treatment for forgiven repossession balances.
4. Recovered-product cost basis and valuation accounting.
5. Exact effect of repair cost on accounting/profit reporting.
6. Exact warranty accounting/logistics treatment beyond the baseline.
7. Exact customer-service handling for exceptional non-warranty cases.
8. Detailed distributor-return workflow outside immediate receiving rejection.
9. Complete product price-list management details and the missing generalized price formula.
10. Actual DP brackets and parameters by product category.
11. Complete multi-store user-role and approval hierarchy.
12. Full accounting model, if later required.
13. Detailed final report definitions.
14. Exact payroll, commission bracket, target, allowance, and fuel allowance rules pending real business data.
15. Whether every inventory discrepancy needs manager approval or only loss/high-value cases.
16. Exact role/system name for accounting-bookkeeping participants.
18. Whether and how temporary/loaner warranty products will be supported later.
19. Exact fields for Picking and related operational documents.

## 17. Assumptions

These items appear in the source as contextual expectations or examples rather than fully locked universal rules:

1. New inventory is primarily demand-driven, although showroom/general stock purchases are possible.
2. Supplier collectors may visit weekly, monthly, or another agreed schedule.
3. A store generally tolerates approximately one month overdue, but this is not an automatic policy.
4. Failed deliveries are expected to be rare because the store calls customers in advance.
5. General stock/showroom replenishment POs are expected to be rare.
6. Storage inventory is described as moving infrequently.
7. Shared expenses are currently not considered significant.
8. Electronics normally require stronger packaging/accessory/original-box considerations than furniture when determining sale classification.
9. Manufacturer/distributor contact and pickup practices may vary by case or product.

## 18. Recommendations

Only recommendations explicitly suggested in the source discussion are included.

1. Treat scrap sale as a legitimate inventory disposition, preserving buyer, proceeds, date, and Product Unit history, rather than deleting the item.
2. Do not create a mandatory loaner-product workflow; treat temporary replacement as optional and potentially add it later as a separate transaction.
3. Do not automatically block an expense solely because the budget is exceeded; require owner approval/additional budget instead.
4. Continue detailed requirements work from repossession consequences into valuation/accounting, warranty, returns, pricing, receiving, delivery, roles, accounting, and reporting, without reopening the mature core flow unless a contradiction emerges.
5. Retain raw financial facts for recovered products rather than embedding an unconfirmed costing formula in inventory behavior.

## 19. Glossary

| Term | Meaning in this specification |
|---|---|
| **Stock opname** | Physical inventory count and verification against expected system Product Units. |
| **Giro** | A bank payment instrument/check used primarily for supplier payments; settlement is complete only after clearing. |
| **DP (Down Payment / Uang Muka)** | Upfront customer payment required for specified credit purchases. |
| **COD (Cash on Delivery)** | Customer inspects and accepts the delivered product, then pays. |
| **SPV** | Supervisor. Mentioned as a relevant Indonesian business role example, but no specific SPV workflow is defined in the source. |
| **Surveyor** | Person who verifies a credit customer's residence/workplace and supporting information; often the manager or a designated employee. |
| **Collector** | Employee or supplier representative who collects money. Customer collection is not restricted to a formal collector job title. |
| **Kwitansi** | Handwritten customer payment receipt. |
| **Picking** | Store delivery execution covering preparation, loading, transport, delivery, and confirmation for applicable Outbounds. |
| **Picking Note** | Driver's operational/travel document, potentially covering multiple Outbounds. |
| **Inbound** | Inventory movement into a store/location after a valid business event. |
| **Outbound** | Inventory movement out of a store/location for a defined business reason. |
| **Surat Jalan / Delivery Note** | Physical document accompanying product delivery or transfer. |
| **Product Unit** | One individually tracked physical product. |
| **Product Unit ID** | Store/system-generated permanent identifier for a Product Unit. |
| **Manufacturer Serial / IMEI** | Manufacturer-provided identifier for applicable products, separate from Product Unit ID. |
| **HD / Base Price** | Source term for the fixed base/cash price selected for pricing calculations. Its full Indonesian expansion is not defined in the source. |
| **Recovered** | Historical state indicating a unit returned through repossession, cancellation after procurement, or another legitimate scenario. |
| **Settled through repossession** | Credit closure where remaining balance is cancelled after successful repossession and previous payments are retained. |
| **Available** | Product Unit can be offered/allocated. |
| **Reserved** | Product Unit is allocated to a customer but may still physically remain in store. |
| **Unavailable** | Product Unit cannot currently be offered, for example during repair, warranty, or post-repossession inspection. |

## 20. Documentation Quality Check

### 20.1 Missing Information

- The generalized credit-price calculation formula referenced as already agreed is not included in the available source text.
- Actual electronics and furniture DP brackets are absent.
- Exact commission, target, position commission, meal allowance, and fuel allowance rules are absent.
- Exact accounting treatment for repossession, recovered-product cost basis, repair cost, and scrap proceeds is absent.
- Complete role/permission matrix is absent.
- Exact report layouts and official accounting definitions are absent.
- Detailed supplier-return workflow after acceptance is absent.

### 20.2 Superseded Decisions Resolved by Chronology

The following earlier statements were replaced by later requirements and are not treated as current conflicts:

1. **Stock opname frequency:** the earlier monthly/month-end requirement is superseded by the later no-fixed-schedule, management-initiated rule.
2. **Standard credit periods:** the earlier Cash/6/12/15-month options are superseded by the later locked Cash/10/12/15-month options.
3. **Multi-item installment dates:** the earlier common schedule based on the first successful delivery is superseded by item-level schedules based on each item's actual delivery date.
4. **Display-product classification:** the later baseline removes a mandatory separate usage classification and permits sale when the unit is usable and authorized.
5. **Warranty responsibility:** the latest baseline confirms that the store manages/tracks the process while the manufacturer/distributor owns technical assessment and may contact the customer directly.
6. **Giro/check detail:** the later finance baseline does not require excessive banking details unless the business later proves they are needed.

No unresolved direct contradiction remains in these areas after applying the source chronology rule.

### 20.3 Duplicate or Refining Decisions

- Repossession and recovered-product rules are repeated several times and remain substantially consistent; later sections add document and lifecycle detail.
- Warranty rules progress from an initial baseline to a final baseline; the latest text controls and sharpens the separation between complaint, delivery rejection, warranty claim, and return.
- Customer-payment allocation becomes less prescriptive in the latest finance summary. The current requirement is reasonable internal prioritization, while exact ordering remains incomplete.
- Display-product statements are treated as refinement: such units are often not sellable, but the latest rule allows sale when usable and authorized without requiring a permanent display classification.

### 20.4 Ambiguous Terminology

- **Supplier**, **Distributor**, **Manufacturer**, and **Vendor** are sometimes used interchangeably but can represent different parties.
- **HD/base price** is not expanded or formally defined.
- **Sale Order** and **Sales Order** both appear; this document standardizes the wording to Sales Order without changing meaning.
- **Internal inventory ID** and **Product Unit ID** appear to represent the same store-generated physical-unit identifier.
- **Picking** has a business-specific, broader meaning than common warehouse picking.
- “Reservation release/change controlled by the surveyor/customer” is unclear as an authority rule.
- The accounting/bookkeeping role naming is not finalized.

### 20.5 Requirements That Appear Incomplete

- Price calculator inputs, formula, approvals, and exception handling.
- DP requirement thresholds and brackets.
- Allocation and reconciliation of excess payments/customer credit.
- Treatment of extra payments against future installments.
- Formal default status and accounting relationship to overdue/repossessed states.
- Recovered-product valuation and profitability.
- Detailed paid-repair workflow after warranty rejection.
- Exceptional customer-service resolution outside normal warranty.
- Supplier return after previously accepted inventory.
- Picking document fields and status definitions.
- Payroll calculations and target periods.
- Expense exception handling where receipt/proof cannot be obtained.
- Cash reconciliation approval scope and resolution categories.
- Role permission and approval matrix.
- Official accounting profit/reporting boundaries.
