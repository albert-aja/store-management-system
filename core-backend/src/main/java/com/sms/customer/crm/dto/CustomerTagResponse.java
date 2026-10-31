package com.sms.customer.crm.dto;

import com.sms.customer.crm.CustomerTag;
import java.util.UUID;

public record CustomerTagResponse(
        UUID id,
        String tagName,
        String color
) {
    public static CustomerTagResponse from(CustomerTag tag) {
        return new CustomerTagResponse(tag.getId(), tag.getTagName(), tag.getColor());
    }
}

