package com.sms.procurement;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('PROCUREMENT_MANAGE')")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public List<SupplierResponse> search(@RequestParam(required = false) String query) {
        return supplierService.search(query).stream().map(SupplierResponse::from).toList();
    }

    @GetMapping("/{id}")
    public SupplierResponse getSupplier(@PathVariable UUID id) {
        return SupplierResponse.from(supplierService.getSupplier(id));
    }

    @PostMapping
    public SupplierResponse createSupplier(@Valid @RequestBody SupplierRequest request) {
        return SupplierResponse.from(supplierService.createSupplier(request));
    }

    @PutMapping("/{id}")
    public SupplierResponse updateSupplier(@PathVariable UUID id, @Valid @RequestBody SupplierRequest request) {
        return SupplierResponse.from(supplierService.updateSupplier(id, request));
    }

    @PostMapping("/{id}/deactivate")
    public void deactivate(@PathVariable UUID id) {
        supplierService.setActive(id, false);
    }

    @PostMapping("/{id}/activate")
    public void activate(@PathVariable UUID id) {
        supplierService.setActive(id, true);
    }

    @GetMapping("/{id}/contacts")
    public List<SupplierContactResponse> listContacts(@PathVariable UUID id) {
        return supplierService.listContacts(id).stream().map(SupplierContactResponse::from).toList();
    }

    @PostMapping("/{id}/contacts")
    public SupplierContactResponse addContact(@PathVariable UUID id, @Valid @RequestBody SupplierContactRequest request) {
        return SupplierContactResponse.from(supplierService.addContact(id, request));
    }

    @PostMapping("/contacts/{contactId}/deactivate")
    public void deactivateContact(@PathVariable UUID contactId) {
        supplierService.setContactActive(contactId, false);
    }
}
