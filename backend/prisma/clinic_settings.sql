BEGIN;

CREATE TABLE IF NOT EXISTS clinic_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(120) NOT NULL,
  address TEXT NOT NULL,
  instagram_url TEXT NOT NULL,
  map_embed_url TEXT NOT NULL,
  directions_url TEXT NOT NULL,
  opening_time VARCHAR(5) NOT NULL,
  closing_time VARCHAR(5) NOT NULL,
  slot_duration_minutes INTEGER NOT NULL,
  working_days INTEGER[] NOT NULL,
  maximum_advance_booking_days INTEGER NOT NULL,
  feedback_expiry_hours INTEGER NOT NULL,
  updated_by_admin_id UUID REFERENCES admin_login_logs(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT clinic_settings_hours_check CHECK (opening_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND closing_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT clinic_settings_slot_check CHECK (slot_duration_minutes IN (15, 30, 45, 60)),
  CONSTRAINT clinic_settings_advance_check CHECK (maximum_advance_booking_days BETWEEN 1 AND 365),
  CONSTRAINT clinic_settings_feedback_check CHECK (feedback_expiry_hours BETWEEN 1 AND 168)
);

INSERT INTO clinic_settings (
  id, phone, whatsapp, email, address, instagram_url, map_embed_url,
  directions_url, opening_time, closing_time, slot_duration_minutes,
  working_days, maximum_advance_booking_days, feedback_expiry_hours
) VALUES (
  1,
  '+91 76201 49613',
  '+91 76201 49613',
  'info@sankalp.com',
  'Sankalp Physiotherapy And Child Development Clinic, Opposite Vithal Mandir, Navathe Stop, Navathe Nagar, Amravati, Maharashtra 444601',
  'https://www.instagram.com/sankalp_physiotherapy_center/?hl=en',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3727.049738128745!2d77.74880807379336!3d20.91031849183895',
  'https://www.google.com/maps/search/?api=1&query=Sankalp+Physiotherapy+And+Child+Development+Clinic%2C+Amravati%2C+Maharashtra+444601',
  '10:00', '19:30', 30, ARRAY[1,2,3,4,5,6], 90, 24
) ON CONFLICT (id) DO NOTHING;

COMMIT;
