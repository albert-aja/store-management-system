package com.sms.repossession;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class RepossessionServiceTest {

    @Mock
    private StockReturnRepository returnRepository;
    @Mock
    private StockReturnDispositionRepository dispositionRepository;
    @Mock
    private WarrantyClaimRepository warrantyClaimRepository;
    @Mock
    private RepairTicketRepository repairTicketRepository;
    @Mock
    private StockDisposalRepository disposalRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private StockUnitRepository stockUnitRepository;
    @Mock
    private StockMovementRepository movementRepository;
    @Mock
    private ReceivableRepository receivableRepository;
    @Mock
    private ReceivableInstallmentRepository installmentRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private DocumentNumberingService numberingService;

    @InjectMocks
    private RepossessionService repossessionService;

    private Store store;
    private Customer customer;
    private StockUnit stockUnit;
    private Employee inspector;

    private static <T> T withId(T entity, UUID id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    @BeforeEach
    void setUp() {
        store = withId(new Store(), UUID.randomUUID());
        store.setName("Main Store");
        store.setCode("ST01");

        customer = withId(new Customer(), UUID.randomUUID());
        customer.setFullName("Budi Customer");

        stockUnit = withId(new StockUnit(), UUID.randomUUID());
        stockUnit.setCurrentStore(store);
        stockUnit.setLocationType(StockLocationType.AT_CUSTOMER);
        stockUnit.setAvailabilityStatus(StockAvailability.UNAVAILABLE);
        stockUnit.setManufacturerSerial("SN-REPOSSESS-001");

        inspector = withId(new Employee(), UUID.randomUUID());
        inspector.setFullName("Inspector Anton");
    }

    @Test
    void initiateReturn_createsInitiatedReturn() {
        CreateStockReturnRequest req = new CreateStockReturnRequest();
        req.setStoreId(store.getId());
        req.setCustomerId(customer.getId());
        req.setStockUnitId(stockUnit.getId());
        req.setReturnType(StockReturnType.REPOSSESSION);
        req.setReason("Overdue default > 45 days");

        when(storeRepository.findById(store.getId())).thenReturn(Optional.of(store));
        when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stockUnitRepository.findById(stockUnit.getId())).thenReturn(Optional.of(stockUnit));
        when(numberingService.nextNumber(store.getId(), "RET")).thenReturn("RET/ST01/10/2026/0001");
        when(returnRepository.save(any(StockReturn.class))).thenAnswer(inv -> {
            StockReturn r = inv.getArgument(0);
            return withId(r, UUID.randomUUID());
        });

        StockReturnResponse resp = repossessionService.initiateReturn(req);

        assertThat(resp.getReturnNumber()).isEqualTo("RET/ST01/10/2026/0001");
        assertThat(resp.getStatus()).isEqualTo(StockReturnStatus.INITIATED);
        assertThat(resp.getReturnType()).isEqualTo(StockReturnType.REPOSSESSION);
    }

    @Test
    void completeReturn_repossessesUnitAndSettlesReceivable() {
        Receivable receivable = withId(new Receivable(), UUID.randomUUID());
        receivable.setStatus(ReceivableStatus.ACTIVE);
        receivable.setTotalAmount(new BigDecimal("5000000"));
        receivable.setTotalPaid(new BigDecimal("1000000"));
        receivable.setRemainingBalance(new BigDecimal("4000000"));

        ReceivableInstallment unpaid = withId(new ReceivableInstallment(), UUID.randomUUID());
        unpaid.setReceivable(receivable);
        unpaid.setAmountDue(new BigDecimal("1000000"));
        unpaid.setStatus(InstallmentStatus.UNPAID);

        StockReturn stockReturn = withId(new StockReturn(), UUID.randomUUID());
        stockReturn.setStore(store);
        stockReturn.setCustomer(customer);
        stockReturn.setStockUnit(stockUnit);
        stockReturn.setReceivable(receivable);
        stockReturn.setReturnType(StockReturnType.REPOSSESSION);
        stockReturn.setStatus(StockReturnStatus.INITIATED);

        when(returnRepository.findById(stockReturn.getId())).thenReturn(Optional.of(stockReturn));
        when(returnRepository.save(any(StockReturn.class))).thenAnswer(inv -> inv.getArgument(0));
        when(installmentRepository.findOutstandingByReceivableId(receivable.getId())).thenReturn(List.of(unpaid));

        CompleteStockReturnRequest req = new CompleteStockReturnRequest();
        req.setNotes("Successfully recovered television from customer living room");

        StockReturnResponse resp = repossessionService.completeReturn(stockReturn.getId(), req);

        assertThat(resp.getStatus()).isEqualTo(StockReturnStatus.RECEIVED_AT_STORE);
        assertThat(stockUnit.getLocationType()).isEqualTo(StockLocationType.WAREHOUSE);
        assertThat(stockUnit.getAvailabilityStatus()).isEqualTo(StockAvailability.UNAVAILABLE); // Must be inspected before available

        // Ledger check
        ArgumentCaptor<StockMovement> moveCaptor = ArgumentCaptor.forClass(StockMovement.class);
        verify(movementRepository).save(moveCaptor.capture());
        assertThat(moveCaptor.getValue().getMovementType()).isEqualTo(MovementType.REPOSSESSION_IN);

        // Financial settlement check: balance forgiven, payments kept (README 13.1)
        assertThat(receivable.getStatus()).isEqualTo(ReceivableStatus.SETTLED_REPOSSESSION);
        assertThat(receivable.getRemainingBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(unpaid.getStatus()).isEqualTo(InstallmentStatus.FORGIVEN);
    }

    @Test
    void completeReturn_withCustomerRefusal() {
        StockReturn stockReturn = withId(new StockReturn(), UUID.randomUUID());
        stockReturn.setStore(store);
        stockReturn.setCustomer(customer);
        stockReturn.setStockUnit(stockUnit);
        stockReturn.setStatus(StockReturnStatus.INITIATED);

        when(returnRepository.findById(stockReturn.getId())).thenReturn(Optional.of(stockReturn));
        when(returnRepository.save(any(StockReturn.class))).thenAnswer(inv -> inv.getArgument(0));

        CompleteStockReturnRequest req = new CompleteStockReturnRequest();
        req.setCustomerRefusalReason("Customer refused entry and locked the gate");

        StockReturnResponse resp = repossessionService.completeReturn(stockReturn.getId(), req);

        assertThat(resp.getStatus()).isEqualTo(StockReturnStatus.CANCELLED);
        assertThat(resp.getCustomerRefusalReason()).isEqualTo("Customer refused entry and locked the gate");
        assertThat(stockUnit.getLocationType()).isEqualTo(StockLocationType.AT_CUSTOMER);
    }

    @Test
    void recordDisposition_sellAsIs_makesUnitAvailable() {
        StockReturn stockReturn = withId(new StockReturn(), UUID.randomUUID());
        stockReturn.setStore(store);
        stockReturn.setStockUnit(stockUnit);
        stockReturn.setStatus(StockReturnStatus.RECEIVED_AT_STORE);

        when(returnRepository.findById(stockReturn.getId())).thenReturn(Optional.of(stockReturn));
        when(employeeRepository.findById(inspector.getId())).thenReturn(Optional.of(inspector));
        when(returnRepository.save(any(StockReturn.class))).thenAnswer(inv -> inv.getArgument(0));

        RecordDispositionRequest req = new RecordDispositionRequest();
        req.setInspectorEmployeeId(inspector.getId());
        req.setConditionNotes("Item in mint condition, clean, box intact");
        req.setDisposition(ReturnDisposition.SELL_AS_IS);
        req.setResalePrice(new BigDecimal("3500000"));

        StockReturnResponse resp = repossessionService.recordDisposition(stockReturn.getId(), req);

        assertThat(resp.getDisposition().getDisposition()).isEqualTo(ReturnDisposition.SELL_AS_IS);
        assertThat(resp.getDisposition().getResalePrice()).isEqualByComparingTo("3500000");
        assertThat(stockUnit.getAvailabilityStatus()).isEqualTo(StockAvailability.AVAILABLE);
        assertThat(stockUnit.getLocationType()).isEqualTo(StockLocationType.SHOWROOM);
    }

    @Test
    void warrantyClaimAndRepairWorkflow() {
        CreateWarrantyClaimRequest claimReq = new CreateWarrantyClaimRequest();
        claimReq.setStoreId(store.getId());
        claimReq.setCustomerId(customer.getId());
        claimReq.setStockUnitId(stockUnit.getId());
        claimReq.setDistributorName("PT Samsung Electronics Indonesia");
        claimReq.setDefectDescription("Display panel flicker and vertical lines");

        when(storeRepository.findById(store.getId())).thenReturn(Optional.of(store));
        when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(stockUnitRepository.findById(stockUnit.getId())).thenReturn(Optional.of(stockUnit));
        when(numberingService.nextNumber(store.getId(), "WAR")).thenReturn("WAR/ST01/10/2026/0001");
        when(warrantyClaimRepository.save(any(WarrantyClaim.class))).thenAnswer(inv -> {
            WarrantyClaim c = inv.getArgument(0);
            return withId(c, UUID.randomUUID());
        });

        WarrantyClaimResponse claimResp = repossessionService.createWarrantyClaim(claimReq);

        assertThat(claimResp.getClaimNumber()).isEqualTo("WAR/ST01/10/2026/0001");
        assertThat(claimResp.getCoverageDecision()).isEqualTo(WarrantyCoverageDecision.PENDING);
        assertThat(claimResp.getStatus()).isEqualTo(WarrantyClaimStatus.OPEN);

        // Decide claim to approve repair
        WarrantyClaim claim = withId(new WarrantyClaim(), claimResp.getId());
        claim.setStore(store);
        claim.setStockUnit(stockUnit);
        claim.setDistributorName("PT Samsung Electronics Indonesia");
        claim.setDefectDescription("Display panel flicker");

        when(warrantyClaimRepository.findById(claim.getId())).thenReturn(Optional.of(claim));
        when(numberingService.nextNumber(store.getId(), "REP")).thenReturn("REP/ST01/10/2026/0001");
        when(repairTicketRepository.save(any(RepairTicket.class))).thenAnswer(inv -> {
            RepairTicket t = inv.getArgument(0);
            return withId(t, UUID.randomUUID());
        });

        DecideWarrantyClaimRequest decideReq = new DecideWarrantyClaimRequest();
        decideReq.setCoverageDecision(WarrantyCoverageDecision.APPROVED_REPAIR);
        decideReq.setDecisionNotes("Authorized service center repair covered under manufacturer warranty");

        WarrantyClaimResponse decidedResp = repossessionService.decideWarrantyClaim(claim.getId(), decideReq);
        assertThat(decidedResp.getStatus()).isEqualTo(WarrantyClaimStatus.UNDER_EVALUATION);
        assertThat(stockUnit.getLocationType()).isEqualTo(StockLocationType.AT_REPAIR_PROVIDER);

        // Complete repair
        RepairTicket ticket = withId(new RepairTicket(), UUID.randomUUID());
        ticket.setStore(store);
        ticket.setStockUnit(stockUnit);
        ticket.setWarrantyClaim(claim);

        when(repairTicketRepository.findById(ticket.getId())).thenReturn(Optional.of(ticket));

        CompleteRepairTicketRequest completeReq = new CompleteRepairTicketRequest();
        completeReq.setStatus(RepairStatus.REPAIRED);
        completeReq.setDiagnosis("T-Con board failure");
        completeReq.setActionTaken("Replaced T-Con board with genuine Samsung component");
        completeReq.setRepairCost(BigDecimal.ZERO); // Warranty covered

        RepairTicketResponse ticketResp = repossessionService.completeRepairTicket(ticket.getId(), completeReq);
        assertThat(ticketResp.getStatus()).isEqualTo(RepairStatus.REPAIRED);
        assertThat(stockUnit.getAvailabilityStatus()).isEqualTo(StockAvailability.AVAILABLE);
        assertThat(stockUnit.getLocationType()).isEqualTo(StockLocationType.WAREHOUSE);
    }

    @Test
    void createStockDisposal_recordsExitAndProceeds() {
        CreateStockDisposalRequest req = new CreateStockDisposalRequest();
        req.setStoreId(store.getId());
        req.setStockUnitId(stockUnit.getId());
        req.setReason("REPOSSESSION_SCRAP");
        req.setBuyerName("CV Logam Jaya Scrap");
        req.setScrapProceeds(new BigDecimal("150000"));
        req.setAuthorizedById(inspector.getId());
        req.setNotes("Smashed casing and broken electronics");

        when(storeRepository.findById(store.getId())).thenReturn(Optional.of(store));
        when(stockUnitRepository.findById(stockUnit.getId())).thenReturn(Optional.of(stockUnit));
        when(employeeRepository.findById(inspector.getId())).thenReturn(Optional.of(inspector));
        when(numberingService.nextNumber(store.getId(), "DIS")).thenReturn("DIS/ST01/10/2026/0001");
        when(disposalRepository.save(any(StockDisposal.class))).thenAnswer(inv -> {
            StockDisposal d = inv.getArgument(0);
            return withId(d, UUID.randomUUID());
        });

        StockDisposalResponse resp = repossessionService.createStockDisposal(req);

        assertThat(resp.getDisposalNumber()).isEqualTo("DIS/ST01/10/2026/0001");
        assertThat(resp.getScrapProceeds()).isEqualByComparingTo("150000");
        assertThat(stockUnit.getLocationType()).isEqualTo(StockLocationType.DISPOSED);

        ArgumentCaptor<StockMovement> moveCaptor = ArgumentCaptor.forClass(StockMovement.class);
        verify(movementRepository).save(moveCaptor.capture());
        assertThat(moveCaptor.getValue().getMovementType()).isEqualTo(MovementType.DISPOSAL);
        assertThat(moveCaptor.getValue().getToLocationType()).isEqualTo(StockLocationType.DISPOSED);
    }
}
