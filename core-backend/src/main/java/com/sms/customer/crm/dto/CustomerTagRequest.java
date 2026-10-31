package com.sms.customer.crm.dto;

import com.sms.customer.crm.CustomerTag;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CustomerTagRequest(
        @NotBlank String tagName,
        String color
) {}

