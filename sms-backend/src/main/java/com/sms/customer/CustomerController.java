package com.sms.customer;

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
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public List<CustomerResponse> search(@RequestParam(required = false) String query) {
        return customerService.search(query).stream().map(CustomerResponse::from).toList();
    }

    @GetMapping("/{id}")
    public CustomerResponse getCustomer(@PathVariable UUID id) {
        return CustomerResponse.from(customerService.getCustomer(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public CustomerResponse createCustomer(@Valid @RequestBody CustomerRequest request) {
        return CustomerResponse.from(customerService.createCustomer(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public CustomerResponse updateCustomer(@PathVariable UUID id, @Valid @RequestBody CustomerRequest request) {
        return CustomerResponse.from(customerService.updateCustomer(id, request));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public void deactivate(@PathVariable UUID id) {
        customerService.setActive(id, false);
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public void activate(@PathVariable UUID id) {
        customerService.setActive(id, true);
    }

    @GetMapping("/{id}/contacts")
    public List<ContactResponse> listContacts(@PathVariable UUID id) {
        return customerService.listContacts(id).stream().map(ContactResponse::from).toList();
    }

    @PostMapping("/{id}/contacts")
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public ContactResponse addContact(@PathVariable UUID id, @Valid @RequestBody ContactRequest request) {
        return ContactResponse.from(customerService.addContact(id, request));
    }

    @PostMapping("/contacts/{contactId}/deactivate")
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public void deactivateContact(@PathVariable UUID contactId) {
        customerService.setContactActive(contactId, false);
    }

    @GetMapping("/{id}/addresses")
    public List<AddressResponse> listAddresses(@PathVariable UUID id) {
        return customerService.listAddresses(id).stream().map(AddressResponse::from).toList();
    }

    @PostMapping("/{id}/addresses")
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public AddressResponse addAddress(@PathVariable UUID id, @Valid @RequestBody AddressRequest request) {
        return AddressResponse.from(customerService.addAddress(id, request));
    }

    @PostMapping("/addresses/{addressId}/set-primary")
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public void setPrimaryAddress(@PathVariable UUID addressId, @RequestParam UUID customerId) {
        customerService.setPrimaryAddress(customerId, addressId);
    }

    @PostMapping("/addresses/{addressId}/deactivate")
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public void deactivateAddress(@PathVariable UUID addressId) {
        customerService.setAddressActive(addressId, false);
    }
}
