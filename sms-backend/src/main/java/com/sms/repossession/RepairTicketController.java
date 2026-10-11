package com.sms.repossession;

import com.sms.repossession.dto.CompleteRepairTicketRequest;
import com.sms.repossession.dto.CreateRepairTicketRequest;
import com.sms.repossession.dto.RepairTicketResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/repairs")
@RequiredArgsConstructor
public class RepairTicketController {

    private final RepossessionService repossessionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('REPOSSESSION_MANAGE')")
    public RepairTicketResponse createTicket(@Valid @RequestBody CreateRepairTicketRequest req) {
        return repossessionService.createRepairTicket(req);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('REPOSSESSION_MANAGE')")
    public RepairTicketResponse completeTicket(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteRepairTicketRequest req) {
        return repossessionService.completeRepairTicket(id, req);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('REPOSSESSION_MANAGE')")
    public List<RepairTicketResponse> listTickets(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) RepairStatus status) {
        return repossessionService.listRepairTickets(storeId, status);
    }
}
