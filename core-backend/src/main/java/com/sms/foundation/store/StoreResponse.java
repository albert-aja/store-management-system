package com.sms.foundation.store;

import java.util.UUID;

public record StoreResponse(UUID id, String code, String name, String address, boolean active) {

    public static StoreResponse from(Store store) {
        return new StoreResponse(store.getId(), store.getCode(), store.getName(), store.getAddress(), store.isActive());
    }
}
