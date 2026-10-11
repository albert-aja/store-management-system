package com.sms.repossession;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.customer.Customer;
import com.sms.customer.CustomerRepository;
import com.sms.finance.InstallmentStatus;
import com.sms.finance.Receivable;
import com.sms.finance.ReceivableInstallment;
import com.sms.finance.ReceivableInstallmentRepository;
import com.sms.finance.ReceivableRepository;
import com.sms.finance.ReceivableStatus;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.numbering.DocumentNumberingService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.inventory.MovementType;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockLocationType;
import com.sms.inventory.StockMovement;
import com.sms.inventory.StockMovementRepository;
import com.sms.inventory.StockUnit;
import com.sms.inventory.StockUnitRepository;
import com.sms.repossession.dto.CompleteRepairTicketRequest;
import com.sms.repossession.dto.CompleteStockReturnRequest;
import com.sms.repossession.dto.CreateRepairTicketRequest;
import com.sms.repossession.dto.CreateStockDisposalRequest;
import com.sms.repossession.dto.CreateStockReturnRequest;
import com.sms.repossession.dto.CreateWarrantyClaimRequest;
import com.sms.repossession.dto.DecideWarrantyClaimRequest;
import com.sms.repossession.dto.RecordDispositionRequest;
import com.sms.repossession.dto.RepairTicketResponse;
import com.sms.repossession.dto.StockDisposalResponse;
import com.sms.repossession.dto.StockReturnResponse;
import com.sms.repossession.dto.WarrantyClaimResponse;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RepossessionService {

    public static final String DOC_TYPE_RETURN = "RET";
    public static final String DOC_TYPE_WARRANTY = "WAR";
    public static final String DOC_TYPE_REPAIR = "REP";
    public static final String DOC_TYPE_DISPOSAL = "DIS";

    private final StockReturnRepository returnRepository;
    private final StockReturnDispositionRepository dispositionRepository;
    private final WarrantyClaimRepository warrantyClaimRepository;
    private final RepairTicketRepository repairTicketRepository;
    private final StockDisposalRepository disposalRepository;

    private final StoreRepository storeRepository;
    private final CustomerRepository customerRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final StockUnitRepository stockUnitRepository;
    private final StockMovementRepository movementRepository;
    private final ReceivableRepository receivableRepository;
    private final ReceivableInstallmentRepository installmentRepository;
    private final EmployeeRepository employeeRepository;
    private final DocumentNumberingService numberingService;

    // --- 1. Stock Return & Repossession ---

    public StockReturnResponse initiateReturn(CreateStockReturnRequest req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + req.getStoreId()));
        Customer customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found: " + req.getCustomerId()));
        StockUnit stockUnit = stockUnitRepository.findById(req.getStockUnitId())
                .orElseThrow(() -> new NotFoundException("Stock unit not found: " + req.getStockUnitId()));

        SalesOrder salesOrder = null;
        if (req.getSalesOrderId() != null) {
            salesOrder = salesOrderRepository.findById(req.getSalesOrderId()).orElse(null);
        }

        Receivable receivable = null;
        if (req.getReceivableId() != null) {
            receivable = receivableRepository.findById(req.getReceivableId()).orElse(null);
        }

        Employee driver = null;
        if (req.getDriverId() != null) {
            driver = employeeRepository.findById(req.getDriverId()).orElse(null);
        }

        Employee helper = null;
        if (req.getHelperId() != null) {
            helper = employeeRepository.findById(req.getHelperId()).orElse(null);
        }

        String returnNumber = numberingService.nextNumber(store.getId(), DOC_TYPE_RETURN);

        StockReturn stockReturn = new StockReturn();
        stockReturn.setReturnNumber(returnNumber);
        stockReturn.setStore(store);
        stockReturn.setCustomer(customer);
        stockReturn.setSalesOrder(salesOrder);
        stockReturn.setStockUnit(stockUnit);
        stockReturn.setReceivable(receivable);
        stockReturn.setReturnType(req.getReturnType() != null ? req.getReturnType() : StockReturnType.REPOSSESSION);
        stockReturn.setStatus(StockReturnStatus.INITIATED);
        stockReturn.setDriver(driver);
        stockReturn.setHelper(helper);
        stockReturn.setVehiclePlate(req.getVehiclePlate());
        stockReturn.setScheduledDate(req.getScheduledDate());
        stockReturn.setReason(req.getReason());
        stockReturn.setNotes(req.getNotes());

        StockReturn saved = returnRepository.save(stockReturn);
        return StockReturnResponse.from(saved);
    }

    public StockReturnResponse completeReturn(UUID returnId, CompleteStockReturnRequest req) {
        StockReturn stockReturn = returnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Stock return not found: " + returnId));

        if (stockReturn.getStatus() == StockReturnStatus.RECEIVED_AT_STORE || stockReturn.getStatus() == StockReturnStatus.CANCELLED) {
            throw new BusinessRuleException("Return is already finalized with status " + stockReturn.getStatus());
        }

        // If customer refused recovery
        if (req.getCustomerRefusalReason() != null && !req.getCustomerRefusalReason().isBlank()) {
            stockReturn.setStatus(StockReturnStatus.CANCELLED);
            stockReturn.setCustomerRefusalReason(req.getCustomerRefusalReason());
            if (req.getNotes() != null) {
                stockReturn.setNotes(req.getNotes());
            }
            return StockReturnResponse.from(returnRepository.save(stockReturn));
        }

        // Successful physical return / recovery
        stockReturn.setStatus(StockReturnStatus.RECEIVED_AT_STORE);
        stockReturn.setRecoveredAt(Instant.now());
        if (req.getNotes() != null) {
            stockReturn.setNotes(req.getNotes());
        }

        StockUnit unit = stockReturn.getStockUnit();
        StockLocationType previousLoc = unit.getLocationType();
        unit.setCurrentStore(stockReturn.getStore());
        unit.setLocationType(StockLocationType.WAREHOUSE);
        unit.setAvailabilityStatus(StockAvailability.UNAVAILABLE); // Unavailable until inspected (README 13.1)
        unit.setReservedForSoItem(null);
        stockUnitRepository.save(unit);

        // Record physical inbound movement in ledger
        MovementType mType = stockReturn.getReturnType() == StockReturnType.REPOSSESSION
                ? MovementType.REPOSSESSION_IN
                : MovementType.CUSTOMER_RETURN;

        StockMovement movement = new StockMovement();
        movement.setStockUnit(unit);
        movement.setMovementType(mType);
        movement.setFromStore(stockReturn.getStore());
        movement.setToStore(stockReturn.getStore());
        movement.setFromLocationType(previousLoc != null ? previousLoc : StockLocationType.AT_CUSTOMER);
        movement.setToLocationType(StockLocationType.WAREHOUSE);
        movement.setReferenceId(stockReturn.getId());
        movement.setReferenceType("STOCK_RETURN");
        movement.setNotes("Return " + stockReturn.getReturnNumber() + " received at store");
        movementRepository.save(movement);

        // Financial settlement on repossession: remaining balance cancelled/forgiven (README 13.1)
        if (stockReturn.getReturnType() == StockReturnType.REPOSSESSION && stockReturn.getReceivable() != null) {
            Receivable r = stockReturn.getReceivable();
            r.setStatus(ReceivableStatus.SETTLED_REPOSSESSION);
            r.setRemainingBalance(BigDecimal.ZERO);
            receivableRepository.save(r);

            List<ReceivableInstallment> unpaid = installmentRepository.findOutstandingByReceivableId(r.getId());
            for (ReceivableInstallment inst : unpaid) {
                inst.setStatus(InstallmentStatus.FORGIVEN);
                installmentRepository.save(inst);
            }
        }

        return StockReturnResponse.from(returnRepository.save(stockReturn));
    }

    public StockReturnResponse recordDisposition(UUID returnId, RecordDispositionRequest req) {
        StockReturn stockReturn = returnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Stock return not found: " + returnId));

        if (stockReturn.getStatus() != StockReturnStatus.RECEIVED_AT_STORE) {
            throw new BusinessRuleException("Cannot inspect return before it is received at store");
        }

        Employee inspector = employeeRepository.findById(req.getInspectorEmployeeId())
                .orElseThrow(() -> new NotFoundException("Inspector employee not found: " + req.getInspectorEmployeeId()));

        StockReturnDisposition disp = new StockReturnDisposition();
        disp.setStockReturn(stockReturn);
        disp.setInspectorEmployee(inspector);
        disp.setConditionNotes(req.getConditionNotes());
        disp.setDisposition(req.getDisposition());
        disp.setResalePrice(req.getResalePrice());
        disp.setInspectedAt(Instant.now());
        dispositionRepository.save(disp);
        stockReturn.setDisposition(disp);

        StockUnit unit = stockReturn.getStockUnit();
        if (req.getDisposition() == ReturnDisposition.SELL_AS_IS) {
            unit.setAvailabilityStatus(StockAvailability.AVAILABLE);
            unit.setLocationType(StockLocationType.SHOWROOM);
            stockUnitRepository.save(unit);
        } else if (req.getDisposition() == ReturnDisposition.REPAIR_THEN_SELL) {
            unit.setAvailabilityStatus(StockAvailability.UNAVAILABLE);
            unit.setLocationType(StockLocationType.REPAIR_AREA);
            stockUnitRepository.save(unit);

            // Automatically open repair ticket
            CreateRepairTicketRequest repairReq = new CreateRepairTicketRequest();
            repairReq.setStoreId(stockReturn.getStore().getId());
            repairReq.setStockUnitId(unit.getId());
            repairReq.setStockReturnId(stockReturn.getId());
            repairReq.setProblemDescription("Post-return repair: " + req.getConditionNotes());
            createRepairTicket(repairReq);
        }

        return StockReturnResponse.from(returnRepository.save(stockReturn));
    }

    // --- 2. Warranty Claims ---

    public WarrantyClaimResponse createWarrantyClaim(CreateWarrantyClaimRequest req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + req.getStoreId()));
        Customer customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found: " + req.getCustomerId()));
        StockUnit stockUnit = stockUnitRepository.findById(req.getStockUnitId())
                .orElseThrow(() -> new NotFoundException("Stock unit not found: " + req.getStockUnitId()));

        SalesOrder salesOrder = null;
        if (req.getSalesOrderId() != null) {
            salesOrder = salesOrderRepository.findById(req.getSalesOrderId()).orElse(null);
        }

        String claimNumber = numberingService.nextNumber(store.getId(), DOC_TYPE_WARRANTY);

        WarrantyClaim claim = new WarrantyClaim();
        claim.setClaimNumber(claimNumber);
        claim.setStore(store);
        claim.setCustomer(customer);
        claim.setSalesOrder(salesOrder);
        claim.setStockUnit(stockUnit);
        claim.setDistributorName(req.getDistributorName());
        claim.setDefectDescription(req.getDefectDescription());
        claim.setDistributorClaimRef(req.getDistributorClaimRef());
        claim.setCoverageDecision(WarrantyCoverageDecision.PENDING);
        claim.setStatus(WarrantyClaimStatus.OPEN);

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        return WarrantyClaimResponse.from(saved);
    }

    public WarrantyClaimResponse decideWarrantyClaim(UUID claimId, DecideWarrantyClaimRequest req) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Warranty claim not found: " + claimId));

        claim.setCoverageDecision(req.getCoverageDecision());
        claim.setDecisionNotes(req.getDecisionNotes());

        if (req.getCoverageDecision() == WarrantyCoverageDecision.APPROVED_REPLACEMENT) {
            if (req.getReplacementStockUnitId() != null) {
                StockUnit repl = stockUnitRepository.findById(req.getReplacementStockUnitId())
                        .orElseThrow(() -> new NotFoundException("Replacement unit not found: " + req.getReplacementStockUnitId()));
                claim.setReplacementStockUnit(repl);
            }
            claim.setStatus(WarrantyClaimStatus.RESOLVED);
            claim.setResolutionDate(Instant.now());
        } else if (req.getCoverageDecision() == WarrantyCoverageDecision.APPROVED_REPAIR) {
            claim.setStatus(WarrantyClaimStatus.UNDER_EVALUATION);
            // Open warranty repair ticket
            CreateRepairTicketRequest repairReq = new CreateRepairTicketRequest();
            repairReq.setStoreId(claim.getStore().getId());
            repairReq.setStockUnitId(claim.getStockUnit().getId());
            repairReq.setWarrantyClaimId(claim.getId());
            repairReq.setVendorName(claim.getDistributorName());
            repairReq.setProblemDescription("Warranty repair: " + claim.getDefectDescription());
            createRepairTicket(repairReq);
        } else if (req.getCoverageDecision() == WarrantyCoverageDecision.REJECTED_CUSTOMER_DAMAGE) {
            claim.setStatus(WarrantyClaimStatus.CLOSED);
            claim.setResolutionDate(Instant.now());
        }

        WarrantyClaim saved = warrantyClaimRepository.save(claim);
        return WarrantyClaimResponse.from(saved);
    }

    // --- 3. Repair Tickets ---

    public RepairTicketResponse createRepairTicket(CreateRepairTicketRequest req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + req.getStoreId()));
        StockUnit stockUnit = stockUnitRepository.findById(req.getStockUnitId())
                .orElseThrow(() -> new NotFoundException("Stock unit not found: " + req.getStockUnitId()));

        WarrantyClaim claim = null;
        if (req.getWarrantyClaimId() != null) {
            claim = warrantyClaimRepository.findById(req.getWarrantyClaimId()).orElse(null);
        }

        StockReturn ret = null;
        if (req.getStockReturnId() != null) {
            ret = returnRepository.findById(req.getStockReturnId()).orElse(null);
        }

        String ticketNumber = numberingService.nextNumber(store.getId(), DOC_TYPE_REPAIR);

        RepairTicket ticket = new RepairTicket();
        ticket.setTicketNumber(ticketNumber);
        ticket.setStore(store);
        ticket.setStockUnit(stockUnit);
        ticket.setWarrantyClaim(claim);
        ticket.setStockReturn(ret);
        ticket.setVendorName(req.getVendorName());
        ticket.setProblemDescription(req.getProblemDescription());
        ticket.setStatus(RepairStatus.SENT_TO_VENDOR);
        ticket.setSentAt(Instant.now());

        stockUnit.setLocationType(StockLocationType.AT_REPAIR_PROVIDER);
        stockUnit.setAvailabilityStatus(StockAvailability.UNAVAILABLE);
        stockUnitRepository.save(stockUnit);

        StockMovement movement = new StockMovement();
        movement.setStockUnit(stockUnit);
        movement.setMovementType(MovementType.REPAIR_OUT);
        movement.setFromStore(store);
        movement.setToStore(store);
        movement.setFromLocationType(StockLocationType.WAREHOUSE);
        movement.setToLocationType(StockLocationType.AT_REPAIR_PROVIDER);
        movement.setReferenceId(ticket.getId());
        movement.setReferenceType("REPAIR_TICKET");
        movement.setNotes("Dispatched for repair to " + req.getVendorName());
        movementRepository.save(movement);

        RepairTicket saved = repairTicketRepository.save(ticket);
        return RepairTicketResponse.from(saved);
    }

    public RepairTicketResponse completeRepairTicket(UUID ticketId, CompleteRepairTicketRequest req) {
        RepairTicket ticket = repairTicketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Repair ticket not found: " + ticketId));

        ticket.setStatus(req.getStatus());
        ticket.setDiagnosis(req.getDiagnosis());
        ticket.setActionTaken(req.getActionTaken());
        if (req.getRepairCost() != null) {
            ticket.setRepairCost(req.getRepairCost());
        }
        ticket.setCompletedAt(Instant.now());
        if (req.getNotes() != null) {
            ticket.setNotes(req.getNotes());
        }

        StockUnit unit = ticket.getStockUnit();
        if (req.getStatus() == RepairStatus.REPAIRED) {
            unit.setLocationType(StockLocationType.WAREHOUSE);
            unit.setAvailabilityStatus(StockAvailability.AVAILABLE);
            stockUnitRepository.save(unit);

            StockMovement movement = new StockMovement();
            movement.setStockUnit(unit);
            movement.setMovementType(MovementType.REPAIR_IN);
            movement.setFromStore(ticket.getStore());
            movement.setToStore(ticket.getStore());
            movement.setFromLocationType(StockLocationType.AT_REPAIR_PROVIDER);
            movement.setToLocationType(StockLocationType.WAREHOUSE);
            movement.setReferenceId(ticket.getId());
            movement.setReferenceType("REPAIR_TICKET");
            movement.setNotes("Repaired unit returned to warehouse");
            movementRepository.save(movement);

            if (ticket.getWarrantyClaim() != null) {
                ticket.getWarrantyClaim().setStatus(WarrantyClaimStatus.RESOLVED);
                ticket.getWarrantyClaim().setResolutionDate(Instant.now());
                warrantyClaimRepository.save(ticket.getWarrantyClaim());
            }
        }

        RepairTicket saved = repairTicketRepository.save(ticket);
        return RepairTicketResponse.from(saved);
    }

    // --- 4. Scrap Disposal ---

    public StockDisposalResponse createStockDisposal(CreateStockDisposalRequest req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + req.getStoreId()));
        StockUnit stockUnit = stockUnitRepository.findById(req.getStockUnitId())
                .orElseThrow(() -> new NotFoundException("Stock unit not found: " + req.getStockUnitId()));
        Employee authorizer = employeeRepository.findById(req.getAuthorizedById())
                .orElseThrow(() -> new NotFoundException("Authorizing employee not found: " + req.getAuthorizedById()));

        String disposalNumber = numberingService.nextNumber(store.getId(), DOC_TYPE_DISPOSAL);

        StockDisposal disposal = new StockDisposal();
        disposal.setDisposalNumber(disposalNumber);
        disposal.setStore(store);
        disposal.setStockUnit(stockUnit);
        disposal.setReason(req.getReason());
        disposal.setBuyerName(req.getBuyerName());
        disposal.setScrapProceeds(req.getScrapProceeds() != null ? req.getScrapProceeds() : BigDecimal.ZERO);
        disposal.setAuthorizedBy(authorizer);
        disposal.setDisposedAt(Instant.now());
        disposal.setNotes(req.getNotes());

        StockLocationType previousLoc = stockUnit.getLocationType();
        stockUnit.setLocationType(StockLocationType.DISPOSED);
        stockUnit.setAvailabilityStatus(StockAvailability.UNAVAILABLE);
        stockUnitRepository.save(stockUnit);

        StockMovement movement = new StockMovement();
        movement.setStockUnit(stockUnit);
        movement.setMovementType(MovementType.DISPOSAL);
        movement.setFromStore(store);
        movement.setToStore(store);
        movement.setFromLocationType(previousLoc != null ? previousLoc : StockLocationType.WAREHOUSE);
        movement.setToLocationType(StockLocationType.DISPOSED);
        movement.setReferenceId(disposal.getId());
        movement.setReferenceType("STOCK_DISPOSAL");
        movement.setNotes("Unit scrapped: " + req.getReason() + " (Proceeds: IDR " + disposal.getScrapProceeds() + ")");
        movementRepository.save(movement);

        StockDisposal saved = disposalRepository.save(disposal);
        return StockDisposalResponse.from(saved);
    }

    // --- Queries ---

    @Transactional(readOnly = true)
    public List<StockReturnResponse> listReturns(UUID storeId, StockReturnStatus status, StockReturnType returnType) {
        return returnRepository.search(storeId, status, returnType).stream()
                .map(StockReturnResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WarrantyClaimResponse> listWarrantyClaims(UUID storeId, WarrantyClaimStatus status) {
        return warrantyClaimRepository.search(storeId, status).stream()
                .map(WarrantyClaimResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RepairTicketResponse> listRepairTickets(UUID storeId, RepairStatus status) {
        return repairTicketRepository.search(storeId, status).stream()
                .map(RepairTicketResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StockDisposalResponse> listDisposals(UUID storeId) {
        return disposalRepository.search(storeId).stream()
                .map(StockDisposalResponse::from)
                .toList();
    }
}
