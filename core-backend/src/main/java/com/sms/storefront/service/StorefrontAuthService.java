package com.sms.storefront.service;

import com.sms.customer.Customer;
import com.sms.customer.CustomerRepository;
import com.sms.storefront.dto.StorefrontAuthDto;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.repository.StorefrontCustomerRepository;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class StorefrontAuthService {
    private final StorefrontCustomerRepository storefrontCustomerRepository;
    private final CustomerRepository customerRepository;
    private final StorefrontIdentityVerifier identityVerifier;

    public StorefrontAuthDto.ProfileResponse session(Jwt jwt) {
        StorefrontCustomer customer = resolveCustomer(jwt);
        return new StorefrontAuthDto.ProfileResponse(
                customer.getId(), customer.getEmail(), customer.getFullName(), customer.getPhone());
    }

    public UUID customerId(Jwt jwt) {
        return jwt == null ? null : resolveCustomer(jwt).getId();
    }

    public UUID requireCustomerId(Jwt jwt) {
        if (jwt == null) {
            throw new BadCredentialsException("Sign in to access your account");
        }
        return resolveCustomer(jwt).getId();
    }

    public StorefrontAuthDto.ProfileResponse getProfile(Jwt jwt, UUID requestedId) {
        StorefrontAuthDto.ProfileResponse profile = session(jwt);
        if (!profile.customerId().equals(requestedId)) {
            throw new AccessDeniedException("Cannot access another customer's profile");
        }
        return profile;
    }

    private StorefrontCustomer resolveCustomer(Jwt jwt) {
        if (jwt == null || !jwt.getAudience().contains("authenticated")) {
            throw new BadCredentialsException("Invalid customer session");
        }
        UUID authUserId;
        try {
            authUserId = UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException ex) {
            throw new BadCredentialsException("Invalid customer identity", ex);
        }
        StorefrontIdentityVerifier.VerifiedUser identity = identityVerifier.verify(jwt);
        String email = identity.email();
        Map<String, Object> metadata = jwt.getClaim("user_metadata");
        email = email.trim().toLowerCase(Locale.ROOT);
        if (email.length() > 150 || email.indexOf('@') <= 0) {
            throw new BadCredentialsException("Email exceeds supported length");
        }
        StorefrontCustomer customer = storefrontCustomerRepository.findByAuthUserId(authUserId)
                .orElse(null);
        if (customer == null) {
            customer = storefrontCustomerRepository.findByEmailIgnoreCase(email).orElse(null);
            if (customer != null && customer.getAuthUserId() != null) {
                throw new AccessDeniedException("Email is linked to another account");
            }
            if (customer == null) {
                Object name = metadata == null ? null : metadata.get("full_name");
                String fullName = name instanceof String value && !value.isBlank()
                        ? value.trim() : email.substring(0, email.indexOf('@'));
                fullName = fullName.substring(0, Math.min(fullName.length(), 150));
                Customer master = new Customer();
                master.setFullName(fullName);
                master.setPrimaryEmail(email);
                master.setSegment("ONLINE_RETAIL");
                customer = new StorefrontCustomer();
                customer.setEmail(email);
                customer.setFullName(fullName);
                customer.setCustomer(customerRepository.save(master));
            }
            if (!customer.isActive()) {
                throw new AccessDeniedException("Customer account is inactive");
            }
            customer.setAuthUserId(authUserId);
            customer = storefrontCustomerRepository.save(customer);
        }
        if (!customer.isActive()) {
            throw new AccessDeniedException("Customer account is inactive");
        }
        return customer;
    }
}
