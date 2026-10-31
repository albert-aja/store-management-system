package com.sms.delivery;

import java.time.LocalTime;
import java.time.ZoneId;

public enum DeliveryWindow {
    MORNING(LocalTime.of(9, 0), LocalTime.of(12, 0)),
    AFTERNOON(LocalTime.of(12, 0), LocalTime.of(17, 0));

    public static final ZoneId ZONE = ZoneId.of("Asia/Jakarta");
    public final LocalTime start;
    public final LocalTime end;

    DeliveryWindow(LocalTime start, LocalTime end) {
        this.start = start;
        this.end = end;
    }
}
