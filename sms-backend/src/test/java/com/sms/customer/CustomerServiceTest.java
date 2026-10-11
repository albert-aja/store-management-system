package com.sms.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private CustomerContactRepository contactRepository;
    @Mock
    private CustomerAddressRepository addressRepository;

    @InjectMocks
    private CustomerService customerService;

    @Test
    void addAddress_clearsPreviousPrimaryWhenNewAddressIsPrimary() {
        UUID customerId = UUID.randomUUID();
        Customer customer = new Customer();
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));

        CustomerAddress existingPrimary = new CustomerAddress();
        existingPrimary.setPrimary(true);
        when(addressRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(List.of(existingPrimary));
        when(addressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        customerService.addAddress(customerId, new AddressRequest("HOME", "123 Main St", null, true));

        assertThat(existingPrimary.isPrimary()).isFalse();
    }

    @Test
    void setAddressActive_clearsPrimaryFlagWhenDeactivated() {
        UUID addressId = UUID.randomUUID();
        CustomerAddress address = new CustomerAddress();
        address.setPrimary(true);
        when(addressRepository.findById(addressId)).thenReturn(Optional.of(address));

        customerService.setAddressActive(addressId, false);

        assertThat(address.isActive()).isFalse();
        assertThat(address.isPrimary()).isFalse();
    }
}
