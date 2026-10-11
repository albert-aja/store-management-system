package com.sms.procurement;

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
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierContactRepository contactRepository;

    @Transactional(readOnly = true)
    public List<Supplier> search(String term) {
        return (term == null || term.isBlank()) ? supplierRepository.findAll() : supplierRepository.search(term.trim());
    }

    @Transactional(readOnly = true)
    public Supplier getSupplier(UUID id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Supplier not found: " + id));
    }

    public Supplier createSupplier(SupplierRequest request) {
        if (hasCode(request) && supplierRepository.existsByCode(request.code())) {
            throw new ConflictException("Supplier code already exists: " + request.code());
        }
        Supplier supplier = new Supplier();
        applyRequest(supplier, request);
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(UUID id, SupplierRequest request) {
        Supplier supplier = getSupplier(id);
        if (hasCode(request) && !request.code().equals(supplier.getCode())
                && supplierRepository.existsByCode(request.code())) {
            throw new ConflictException("Supplier code already exists: " + request.code());
        }
        applyRequest(supplier, request);
        return supplier;
    }

    private boolean hasCode(SupplierRequest request) {
        return request.code() != null && !request.code().isBlank();
    }

    private void applyRequest(Supplier supplier, SupplierRequest request) {
        supplier.setName(request.name());
        supplier.setCode(hasCode(request) ? request.code() : null);
        supplier.setAddress(request.address());
        supplier.setNotes(request.notes());
    }

    public void setActive(UUID id, boolean active) {
        getSupplier(id).setActive(active);
    }

    @Transactional(readOnly = true)
    public List<SupplierContact> listContacts(UUID supplierId) {
        return contactRepository.findBySupplierIdOrderByCreatedAtDesc(supplierId);
    }

    public SupplierContact addContact(UUID supplierId, SupplierContactRequest request) {
        Supplier supplier = getSupplier(supplierId);
        SupplierContact contact = new SupplierContact();
        contact.setSupplier(supplier);
        contact.setContactType(request.contactType());
        contact.setLabel(request.label());
        contact.setValue(request.value());
        contact.setNotes(request.notes());
        return contactRepository.save(contact);
    }

    public void setContactActive(UUID contactId, boolean active) {
        SupplierContact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new NotFoundException("Contact not found: " + contactId));
        contact.setActive(active);
    }
}
