CREATE TABLE IF NOT EXISTS file (
  id   INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  blob TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS image (
  id       INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL,
  file_id  INTEGER NOT NULL,
  textures TEXT,

  CONSTRAINT fk_image_file FOREIGN KEY (file_id) REFERENCES file(id)
);

CREATE TABLE IF NOT EXISTS texture (
  id            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  file_id       INTEGER NOT NULL,
  audio_file_id INTEGER NOT NULL,

  CONSTRAINT fk_texture_file FOREIGN KEY (file_id) REFERENCES file(id),
  CONSTRAINT fk_texture_audio_file FOREIGN KEY (audio_file_id) REFERENCES file(id)
);

CREATE TABLE IF NOT EXISTS history (
  id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  images     TEXT,
  textures   TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
)
