package com.sms.common.security;

import java.util.Collection;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/** Wraps the resolved {@link SmsUserPrincipal} instead of the raw Jwt as the auth principal. */
public class SmsAuthenticationToken extends AbstractAuthenticationToken {

    private final SmsUserPrincipal principal;
    private final Jwt jwt;

    public SmsAuthenticationToken(SmsUserPrincipal principal, Jwt jwt, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.principal = principal;
        this.jwt = jwt;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return jwt;
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }
}
