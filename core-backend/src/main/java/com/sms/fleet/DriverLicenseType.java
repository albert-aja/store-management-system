package com.sms.fleet;

public enum DriverLicenseType {
    SIM_A("SIM A - Passenger & Light Cargo"),
    SIM_B1("SIM B1 - Private Truck & Bus (>3,500 kg)"),
    SIM_B1_UMUM("SIM B1 Umum - Commercial Truck / Freight"),
    SIM_B2("SIM B2 - Heavy Articulated Truck"),
    SIM_B2_UMUM("SIM B2 Umum - Commercial Heavy Prime Mover"),
    SIM_C("SIM C - Motorcycle / Two-Wheeler");

    private final String label;

    DriverLicenseType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}

