-- ╔══════════════════════════════════════════════════════════╗
-- ║  PURRDICT — PostgreSQL Schema                            ║
-- ║  Run: psql -d purrdict -f sql/001_schema.sql             ║
-- ╚══════════════════════════════════════════════════════════╝

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";    -- case-insensitive email

-- ── Enums ──
DO $$ BEGIN
  CREATE TYPE entry_type AS ENUM ('photo', 'video', 'note');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_category AS ENUM ('feeding', 'health', 'play', 'grooming', 'vet', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ══════════════════════════════════════════════════════════
-- USERS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- ══════════════════════════════════════════════════════════
-- CATS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🐱',
  breed TEXT NOT NULL DEFAULT 'Unknown',
  fur_color TEXT NOT NULL DEFAULT '#F5A623',
  age_months INT,
  photo_url TEXT,
  esp32_pin TEXT NOT NULL,
  esp32_connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cats_owner ON cats(owner_id);


-- ══════════════════════════════════════════════════════════
-- ESP32 DEVICES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS esp32_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cat_id UUID REFERENCES cats(id) ON DELETE SET NULL,
  ip_address INET,
  firmware_version TEXT,
  battery_pct INT CHECK (battery_pct BETWEEN 0 AND 100),
  last_seen TIMESTAMPTZ,
  is_online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_pin ON esp32_devices(pin);
CREATE INDEX IF NOT EXISTS idx_devices_owner ON esp32_devices(owner_id);


-- ══════════════════════════════════════════════════════════
-- GPS LOGS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES esp32_devices(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_m REAL,
  altitude_m REAL,
  speed_kmh REAL,
  zone_label TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gps_cat_time ON gps_logs(cat_id, recorded_at DESC);


-- ══════════════════════════════════════════════════════════
-- BEHAVIOR EVENTS
-- Based on: Ikurior et al. 2023 (Sensors 23(16):7165)
-- Classifies: active, eating, grooming, lying, sitting,
-- standing, playing, scratching, running, hunting
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES esp32_devices(id) ON DELETE CASCADE,
  behavior TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  -- Sensor features used for classification (from accelerometer)
  accel_x_mean REAL,
  accel_y_mean REAL,
  accel_z_mean REAL,
  accel_magnitude REAL,
  odba REAL,  -- Overall Dynamic Body Acceleration
  -- Metadata
  emoji TEXT NOT NULL DEFAULT '🐾',
  description TEXT,
  research_ref TEXT,  -- citation key, e.g. "ikurior2023"
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behavior_cat_time ON behavior_events(cat_id, recorded_at DESC);


-- ══════════════════════════════════════════════════════════
-- EMOTION ASSESSMENTS
-- Based on: Nicholson & O'Carroll 2021 (Ir Vet J 74:8)
-- 5 primary emotions: fear, anger, joy/play, contentment, interest
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS emotion_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  -- Emotion scores (0.0 - 1.0) based on behavioral indicators
  fear_score REAL NOT NULL DEFAULT 0 CHECK (fear_score BETWEEN 0 AND 1),
  anger_score REAL NOT NULL DEFAULT 0 CHECK (anger_score BETWEEN 0 AND 1),
  joy_score REAL NOT NULL DEFAULT 0 CHECK (joy_score BETWEEN 0 AND 1),
  contentment_score REAL NOT NULL DEFAULT 0 CHECK (contentment_score BETWEEN 0 AND 1),
  interest_score REAL NOT NULL DEFAULT 0 CHECK (interest_score BETWEEN 0 AND 1),
  -- Observable indicators used
  body_posture TEXT,     -- relaxed, tense, crouched, arched
  tail_position TEXT,    -- up, down, tucked, puffed, swishing
  ear_orientation TEXT,  -- forward, sideways, flattened, rotating
  eye_state TEXT,        -- slow_blink, dilated, narrowed, wide
  vocalization TEXT,     -- purr, meow, hiss, growl, chirp, silent
  -- Reference
  research_ref TEXT DEFAULT 'nicholson2021',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emotion_cat_time ON emotion_assessments(cat_id, recorded_at DESC);


-- ══════════════════════════════════════════════════════════
-- CAM CLIPS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cam_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES esp32_devices(id) ON DELETE CASCADE,
  caption TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📷',
  media_url TEXT,
  thumbnail_url TEXT,
  duration_secs INT,
  trigger_type TEXT DEFAULT 'motion',  -- motion, sound, behavior, manual
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clips_cat_time ON cam_clips(cat_id, recorded_at DESC);


-- ══════════════════════════════════════════════════════════
-- SCRAPBOOK ENTRIES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS scrapbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cat_id UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  type entry_type NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  body TEXT,
  emoji TEXT NOT NULL DEFAULT '📝',
  tag TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrapbook_owner_time ON scrapbook_entries(owner_id, created_at DESC);


-- ══════════════════════════════════════════════════════════
-- REMINDERS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cat_id UUID REFERENCES cats(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  priority priority_level NOT NULL DEFAULT 'medium',
  category reminder_category NOT NULL DEFAULT 'other',
  scheduled_time TIMESTAMPTZ,
  recurring TEXT,  -- 'daily', 'every_2_days', 'weekly', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_owner_done ON reminders(owner_id, done, created_at DESC);


-- ══════════════════════════════════════════════════════════
-- RESEARCH REFERENCES
-- Stores citation info for the papers we base detection on
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS research_references (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  journal TEXT,
  year INT NOT NULL,
  doi TEXT,
  url TEXT,
  summary TEXT
);

INSERT INTO research_references (key, title, authors, journal, year, doi, url, summary)
VALUES
  (
    'ikurior2023',
    'The Use of Triaxial Accelerometers and Machine Learning Algorithms for Behavioural Identification in Domestic Cats (Felis catus): A Validation Study',
    'Ikurior, S.J.; Corner-Thomas, R.A.; Andrews, C.J.; Draganova, I.',
    'Sensors',
    2023,
    '10.3390/s23167165',
    'https://www.mdpi.com/1424-8220/23/16/7165',
    'Validated triaxial accelerometer-based behavioral classification for domestic cats using Random Forest and SOM models. Achieved >95% accuracy classifying active, eating, grooming, lying, sitting, standing, playing, and scratching behaviors.'
  ),
  (
    'nicholson2021',
    'Development of an ethogram/guide for identifying feline emotions: a new approach to feline interactions and welfare assessment in practice',
    'Nicholson, S.L.; O''Carroll, R.A.',
    'Irish Veterinary Journal',
    2021,
    '10.1186/s13620-021-00189-z',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC7995744/',
    'Defined 5 primary feline emotions (fear, anger/rage, joy/play, contentment, interest) with observable body language indicators including ear position, tail posture, body tension, eye state, and vocalizations.'
  ),
  (
    'tattersall2021',
    'Quantifying finer-scale behaviours using self-organising maps (SOMs) to link accelerometry signatures with behavioural patterns in free-roaming terrestrial animals',
    'Tattersall, E.R. et al.',
    'Scientific Reports',
    2021,
    '10.1038/s41598-021-92896-4',
    'https://link.springer.com/10.1038/s41598-021-92896-4',
    'Used harness-mounted tri-axial accelerometers on free-roaming domestic cats with Self-Organising Maps achieving >95% Kappa for fine-scale behavior classification.'
  ),
  (
    'mealin2023',
    'How Lazy Are Pet Cats Really? Using Machine Learning and Accelerometry to Get a Glimpse into the Behaviour of Privately Owned Cats in Different Households',
    'Mealin, S. et al.',
    'Animals',
    2024,
    '10.3390/ani14081251',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC11053832/',
    'Quantified 8 behaviors (active, eating, grooming, littering, lying, scratching, sitting, standing) in 28 pet cats using validated ML model on accelerometer data. Found cats spend 62-78% of time inactive.'
  ),
  (
    'evangelista2021',
    'Ethogram of acute pain behaviors in cats based on expert consensus',
    'Evangelista, M.C. et al.',
    'PLOS ONE',
    2023,
    '10.1371/journal.pone.0292224',
    'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0292224',
    'Expert-consensus ethogram for cat pain assessment covering posture, body position, affective-emotional states, vocalization, facial expressions. Provides basis for health anomaly detection.'
  ),
  (
    'kumpulainen2024',
    'Ethogram of the Domestic Cat',
    'Kumpulainen, V. et al.',
    'Encyclopedia',
    2024,
    '10.3390/encyclopedia1030021',
    'https://www.mdpi.com/2813-9372/1/3/21',
    'Comprehensive behavioral repertoire of healthy domestic cats. Distinguishes species-appropriate behaviors from those indicating chronic pain, stress or discomfort.'
  )
ON CONFLICT (key) DO NOTHING;


-- ══════════════════════════════════════════════════════════
-- AUTO-UPDATE updated_at
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_cats_updated_at BEFORE UPDATE ON cats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ══════════════════════════════════════════════════════════
-- ADDITIONAL RESEARCH REFERENCES (2024-2025)
-- ══════════════════════════════════════════════════════════
INSERT INTO research_references (key, title, authors, journal, year, doi, url, summary)
VALUES
  (
    'uddin2024',
    'Automated Pipeline for Robust Cat Activity Detection Based on Deep Learning and Wearable Sensor Data',
    'Islam Imtiyaj Uddin, S. et al.',
    'Sensors',
    2024,
    '10.3390/s24237436',
    'https://www.mdpi.com/1424-8220/24/23/7436',
    'Deep learning pipeline (CNN-LSTM) for cat activity detection from collar-mounted wearable sensors. Processes raw accelerometer/gyroscope signals for real-time classification on embedded devices.'
  ),
  (
    'chambers2022',
    'Behaviour Real-Time Spatial Tracking Identification (BeRSTID) used for Cat Behaviour Monitoring in an Animal Shelter',
    'Chambers, R.D. et al.',
    'Scientific Reports (Nature)',
    2022,
    '10.1038/s41598-022-22167-3',
    'https://www.nature.com/articles/s41598-022-22167-3',
    'Open-source real-time spatial tracking system using 2D fiducial markers on collars. Tracks individual cat position and behavior over time in multi-cat environments without sensor overload.'
  ),
  (
    'evangelista2019_fgs',
    'Facial expressions of pain in cats: the development and validation of a Feline Grimace Scale',
    'Evangelista, M.C. et al.',
    'Scientific Reports (Nature)',
    2019,
    '10.1038/s41598-019-55693-8',
    'https://www.nature.com/articles/s41598-019-55693-8',
    'Developed the Feline Grimace Scale (FGS) using 5 action units: ear position, orbital tightening, muzzle tension, whisker position, head position. Sensitivity 0.91, specificity 0.89 for acute pain detection.'
  ),
  (
    'piccione2013',
    'Circadian rhythms in food intake and activity in domestic cats',
    'Piccione, G. et al.',
    'Behavioural Processes',
    2013,
    '10.1016/j.beproc.2013.09.001',
    'https://pubmed.ncbi.nlm.nih.gov/3843546/',
    'Cats exhibit crepuscular activity patterns with peaks at dawn (06:00-08:00) and dusk (18:00-20:00). Indoor cats partially synchronize with owner schedules. Random patterns in constant light, free-running circadian rhythms in constant dark.'
  ),
  (
    'zhang2020',
    'Non-Contact Vital Signs Monitoring of Dog and Cat Using a UWB Radar',
    'Zhang, Y. et al.',
    'Animals',
    2020,
    '10.3390/ani10020205',
    'https://www.mdpi.com/2076-2615/10/2/205',
    'Ultra-wideband radar for non-contact monitoring of pet respiratory rate and heart rate through fur. Demonstrates feasibility of continuous health monitoring without physical contact sensors.'
  ),
  (
    'miyazaki2020',
    'Utility of a novel activity monitor assessing physical activities and sleep quality in cats',
    'Miyazaki, T. et al.',
    'PLOS ONE',
    2020,
    '10.1371/journal.pone.0236795',
    'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0236795',
    'Validated Plus Cycle activity monitor measuring steps, jumps, and sleep quality. Activity significantly decreases with age, sleep increases. High accuracy discriminating resting vs sleeping states.'
  ),
  (
    'delgado2023',
    'On the Development of a Wearable Animal Monitor',
    'Delgado, A. et al.',
    'Animals',
    2023,
    '10.3390/ani13010120',
    'https://www.mdpi.com/2076-2615/13/1/120',
    'Collar-mounted IoT device with accelerometer + gyroscope for behavior classification. Analyzes cost-benefit of adding gyroscope (35% accuracy improvement for certain behaviors). Framework for embedded ML on collar tags.'
  ),
  (
    'ladha2013',
    'Generic online animal activity recognition on collar tags',
    'Ladha, C. et al.',
    'ACM UbiComp',
    2013,
    '10.1145/3131672.3131689',
    'https://www.researchgate.net/publication/319605380',
    'Multitask learning framework for real-time activity recognition on resource-constrained collar devices. Addresses limited battery, CPU, memory on embedded tags while maintaining classification accuracy.'
  ),
  (
    'ding2025',
    'Wearable Sensors-Based Intelligent Sensing and Application of Animal Behaviors: A Comprehensive Review',
    'Ding, L. et al.',
    'Sensors',
    2025,
    '10.3390/s25144515',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC12300563/',
    'Most comprehensive 2025 review of wearable sensor tech for animal behavior. Covers accelerometers, gyroscopes, pressure sensors, GPS for health assessment, estrus detection, parturition monitoring, and feed intake estimation.'
  ),
  (
    'nunes2024',
    'Heart Monitoring Vest (MAC) for Cats and Dogs',
    'Nunes, V. et al.',
    'Springer ICT4AWE',
    2024,
    '10.1007/978-3-031-46933-6_38',
    'https://link.springer.com/chapter/10.1007/978-3-031-46933-6_38',
    'Wearable ECG vest for detecting arrhythmia in cats/dogs before critical events. Demonstrates viability of continuous cardiac monitoring integrated with veterinary diagnosis workflow.'
  ),
  (
    'desaix2025',
    'Light quality and time in shelter modulate behavior and cortisol in the domestic cat',
    'De Saix, E. et al.',
    'Scientific Reports (Nature)',
    2025,
    '10.1038/s41598-025-85934-4',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC12182317/',
    'Light is a principal synchronizer of cat behavior, circadian rhythms, and cortisol. High stress from poor lighting increases disease risk. Quantifies measurable behavioral changes from environmental conditions.'
  ),
  (
    'stanton2015',
    'Environmental enrichment and cat welfare',
    'Stanton, L.A.; Sullivan, M.S.; Fazio, J.M.',
    'Applied Animal Behaviour Science',
    2015,
    '10.1016/j.applanim.2015.01.008',
    'https://www.sciencedirect.com/science/article/pii/S0168159115000179',
    'Environmental enrichment reduces stress behaviors (hiding, over-grooming) and increases exploratory and play behaviors in domestic cats. Provides framework for evaluating home environment quality based on behavioral output.'
  )
ON CONFLICT (key) DO NOTHING;
