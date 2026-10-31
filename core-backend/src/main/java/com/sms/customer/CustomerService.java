package com.sms.customer;

import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerContactRepository contactRepository;
    private final CustomerAddressRepository addressRepository;

    @Transactional(readOnly = true)
    public List<Customer> search(String term) {
        return (term == null || term.isBlank()) ? customerRepository.findAll() : customerRepository.search(term.trim());
    }

    @Transactional(readOnly = true)
    public Customer getCustomer(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + id));
    }

    public Customer createCustomer(CustomerRequest request) {
        if (request.nik() != null && !request.nik().isBlank() && customerRepository.existsByNik(request.nik())) {
            throw new ConflictException("NIK already exists: " + request.nik());
        }
        Customer customer = new Customer();
        applyRequest(customer, request);
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(UUID id, CustomerRequest request) {
        Customer customer = getCustomer(id);
        if (request.nik() != null && !request.nik().equals(customer.getNik())
                && customerRepository.existsByNik(request.nik())) {
            throw new ConflictException("NIK already exists: " + request.nik());
        }
        applyRequest(customer, request);
        return customer;
    }

    private void applyRequest(Customer customer, CustomerRequest request) {
        customer.setFullName(request.fullName());
        customer.setNik(request.nik());
        customer.setPrimaryPhone(request.primaryPhone());
        customer.setPrimaryEmail(request.primaryEmail());
        if (request.motherMaidenName() != null) customer.setMotherMaidenName(request.motherMaidenName());
        if (request.birthDate() != null) customer.setBirthDate(request.birthDate());
        if (request.birthPlace() != null) customer.setBirthPlace(request.birthPlace());
    }

    public void setActive(UUID id, boolean active) {
        getCustomer(id).setActive(active);
    }

    @Transactional(readOnly = true)
    public List<CustomerContact> listContacts(UUID customerId) {
        return contactRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public CustomerContact addContact(UUID customerId, ContactRequest request) {
        Customer customer = getCustomer(customerId);
        CustomerContact contact = new CustomerContact();
        contact.setCustomer(customer);
        contact.setContactType(request.contactType());
        contact.setLabel(request.label());
        contact.setValue(request.value());
        contact.setNotes(request.notes());
        return contactRepository.save(contact);
    }

    public void setContactActive(UUID contactId, boolean active) {
        CustomerContact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new NotFoundException("Contact not found: " + contactId));
        contact.setActive(active);
    }

    @Transactional(readOnly = true)
    public List<CustomerAddress> listAddresses(UUID customerId) {
        return addressRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public CustomerAddress addAddress(UUID customerId, AddressRequest request) {
        Customer customer = getCustomer(customerId);
        if (request.primary()) {
            clearExistingPrimary(customerId);
        }
        CustomerAddress address = new CustomerAddress();
        address.setCustomer(customer);
        address.setLabel(request.label());
        address.setAddressLine(request.addressLine());
        address.setNotes(request.notes());
        address.setPrimary(request.primary());
        return addressRepository.save(address);
    }

    public void setPrimaryAddress(UUID customerId, UUID addressId) {
        clearExistingPrimary(customerId);
        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new NotFoundException("Address not found: " + addressId));
        address.setPrimary(true);
    }

    private void clearExistingPrimary(UUID customerId) {
        addressRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .filter(CustomerAddress::isPrimary)
                .forEach(a -> a.setPrimary(false));
    }

    public void setAddressActive(UUID addressId, boolean active) {
        CustomerAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new NotFoundException("Address not found: " + addressId));
        address.setActive(active);
        if (!active) {
            address.setPrimary(false);
        }
    }
}
