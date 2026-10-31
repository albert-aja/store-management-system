package com.sms.storefront;

import com.sms.customer.Customer;
import com.sms.customer.CustomerRepository;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.repository.StorefrontCustomerRepository;
import com.sms.storefront.service.StorefrontAuthService;
import com.sms.storefront.service.StorefrontIdentityVerifier;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StorefrontAuthServiceTest {
    @Mock StorefrontCustomerRepository storefrontCustomerRepository;
    @Mock CustomerRepository customerRepository;
    @Mock StorefrontIdentityVerifier identityVerifier;
    @InjectMocks StorefrontAuthService service;

    private final UUID authUserId = UUID.randomUUID();

    private Jwt token() {
        return Jwt.withTokenValue("verified-token").header("alg", "RS256")
                .subject(authUserId.toString()).audience(java.util.List.of("authenticated"))
                .claim("user_metadata", Map.of("full_name", "Customer Name")).build();
    }

    private StorefrontCustomer customer() {
        StorefrontCustomer customer = new StorefrontCustomer();
        ReflectionTestUtils.setField(customer, "id", UUID.randomUUID());
        customer.setEmail("customer@example.com");
        customer.setFullName("Customer Name");
        return customer;
    }

    private void verified(Jwt jwt) {
        when(identityVerifier.verify(jwt)).thenReturn(new StorefrontIdentityVerifier.VerifiedUser(
                authUserId, "Customer@Example.com", "2026-01-01T00:00:00Z"));
    }

    @Test
    void provisionsNewVerifiedCustomerWithoutPassword() {
        Jwt jwt = token();
        verified(jwt);
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(storefrontCustomerRepository.save(any(StorefrontCustomer.class))).thenAnswer(invocation -> {
            StorefrontCustomer customer = invocation.getArgument(0);
            ReflectionTestUtils.setField(customer, "id", UUID.randomUUID());
            return customer;
        });
        var profile = service.session(jwt);
        assertNotNull(profile.customerId());
        assertEquals("customer@example.com", profile.email());
        assertEquals("Customer Name", profile.fullName());
        assertNull(profile.phone());
        verify(storefrontCustomerRepository).save(argThat(customer ->
                authUserId.equals(customer.getAuthUserId()) && customer.getPasswordHash() == null));
    }

    @Test
    void reusesProfileByVerifiedSubject() {
        Jwt jwt = token();
        verified(jwt);
        StorefrontCustomer customer = customer();
        customer.setAuthUserId(authUserId);
        when(storefrontCustomerRepository.findByAuthUserId(authUserId)).thenReturn(Optional.of(customer));
        assertEquals(customer.getId(), service.session(jwt).customerId());
        verify(storefrontCustomerRepository, never()).save(any());
        verifyNoInteractions(customerRepository);
    }

    @Test
    void linksExistingLegacyAccountOnlyAfterEmailVerification() {
        Jwt jwt = token();
        verified(jwt);
        StorefrontCustomer customer = customer();
        when(storefrontCustomerRepository.findByEmailIgnoreCase("customer@example.com"))
                .thenReturn(Optional.of(customer));
        when(storefrontCustomerRepository.save(customer)).thenReturn(customer);
        assertEquals(customer.getId(), service.session(jwt).customerId());
        assertEquals(authUserId, customer.getAuthUserId());
        verifyNoInteractions(customerRepository);
    }

    @Test
    void rejectsEmailAlreadyLinkedToDifferentSubject() {
        Jwt jwt = token();
        verified(jwt);
        StorefrontCustomer customer = customer();
        customer.setAuthUserId(UUID.randomUUID());
        when(storefrontCustomerRepository.findByEmailIgnoreCase("customer@example.com"))
                .thenReturn(Optional.of(customer));
        assertThrows(AccessDeniedException.class, () -> service.session(jwt));
        verify(storefrontCustomerRepository, never()).save(any());
    }

    @Test
    void rejectsInactiveCustomerAndOtherCustomerProfile() {
        Jwt jwt = token();
        verified(jwt);
        StorefrontCustomer customer = customer();
        customer.setAuthUserId(authUserId);
        when(storefrontCustomerRepository.findByAuthUserId(authUserId)).thenReturn(Optional.of(customer));
        assertThrows(AccessDeniedException.class, () -> service.getProfile(jwt, UUID.randomUUID()));
        customer.setActive(false);
        assertThrows(AccessDeniedException.class, () -> service.session(jwt));
    }

    @Test
    void refusesUnverifiedIdentityBeforeLinking() {
        Jwt jwt = token();
        when(identityVerifier.verify(jwt)).thenThrow(new BadCredentialsException("A verified email is required"));
        assertThrows(BadCredentialsException.class, () -> service.session(jwt));
        verifyNoInteractions(storefrontCustomerRepository, customerRepository);
    }

    @Test
    void guestCannotRequireAccountIdentity() {
        assertNull(service.customerId(null));
        assertThrows(BadCredentialsException.class, () -> service.requireCustomerId(null));
        Jwt anonymous = Jwt.withTokenValue("anonymous").header("alg", "RS256")
                .subject(authUserId.toString()).audience(java.util.List.of("anon")).build();
        assertThrows(BadCredentialsException.class, () -> service.session(anonymous));
        verifyNoInteractions(identityVerifier, storefrontCustomerRepository, customerRepository);
    }
}
