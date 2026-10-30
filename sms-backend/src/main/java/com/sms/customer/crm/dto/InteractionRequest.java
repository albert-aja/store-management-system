package com.sms.customer.crm.dto;

import com.sms.customer.crm.CustomerInteraction;
import com.sms.customer.crm.InteractionChannel;
import com.sms.customer.crm.InteractionDirection;
import com.sms.customer.crm.InteractionOutcome;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record InteractionRequest(
        @NotNull InteractionChannel channel,
        @NotNull InteractionDirection direction,
        @NotBlank String summary,
        String details,
        InteractionOutcome outcome
) {}

