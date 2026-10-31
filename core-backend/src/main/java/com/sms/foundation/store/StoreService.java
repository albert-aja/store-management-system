package com.sms.foundation.store;

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
public class StoreService {

    private final StoreRepository storeRepository;

    @Transactional(readOnly = true)
    public List<Store> listStores() {
        return storeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Store getStore(UUID id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Store not found: " + id));
    }

    public Store createStore(StoreRequest request) {
        if (storeRepository.existsByCode(request.code())) {
            throw new ConflictException("Store code already exists: " + request.code());
        }
        Store store = new Store();
        store.setCode(request.code());
        store.setName(request.name());
        store.setAddress(request.address());
        return storeRepository.save(store);
    }

    public Store updateStore(UUID id, StoreRequest request) {
        Store store = getStore(id);
        store.setName(request.name());
        store.setAddress(request.address());
        return store;
    }

    public void setActive(UUID id, boolean active) {
        getStore(id).setActive(active);
    }
}
