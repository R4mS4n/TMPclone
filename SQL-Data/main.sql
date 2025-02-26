CREATE DATABASE IF NOT EXISTS TMPDB;

USE TMPDB;

CREATE TABLE Team(
  team_id INT NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
CREATE TABLE User(
  user_id INT NOT NULL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  mail VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  profile_pic BLOB,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  team_id INT,
  role VARCHAR(50),
  FOREIGN KEY (team_id) REFERENCES Team(team_id)
);

CREATE TABLE Tournament(
  tournament_id INT NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit INT NOT NULL
);

CREATE TABLE Leaderboard (
    leaderboard_id INT NOT NULL PRIMARY KEY,
    user_id INT,
    tournament_id INT,
    position INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
);

CREATE TABLE TournamentParticipation (
    user_id INT,
    tournament_id INT,
    score INT,
    PRIMARY KEY (user_id, tournament_id),
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
);

-- Table for Progress Reports
CREATE TABLE ProgressReport (
    report_id INT NOT NULL PRIMARY KEY,
    user_id INT,  -- FK to User table
    solved_problems TEXT,  -- FK to a problems table or just a list of solved problems
    average_time INT,
    obtained_achievements TEXT,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

-- Table for Questions
CREATE TABLE Question (
    question_id INT NOT NULL PRIMARY KEY,
    content TEXT,
    language VARCHAR(50),
    topic VARCHAR(100),
    difficulty VARCHAR(50),
    tournament_id INT,  -- FK to Tournament table
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
);

-- Table for Code Sent
CREATE TABLE CodeSent (
    CodeSent_id INT NOT NULL PRIMARY KEY,
    user_id INT,  -- FK to User table
    pregunta_id INT,  -- FK to Question table
    tournament_id INT,  -- FK to Tournament table
    code TEXT,
    state VARCHAR(50),
    score INT,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (pregunta_id) REFERENCES Question(question_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
);

-- Table for User Achievements
CREATE TABLE User_Achievement (
    id_desafio INT NOT NULL PRIMARY KEY,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    recompensa_xp INT
);

-- Table for Progress Report (Another version)
CREATE TABLE ReporteProgreso (
    id_reporte INT NOT NULL PRIMARY KEY,
    usuario_id INT,  -- FK to User table
    problemas_resueltos TEXT,
    tiempo_promedio INT,
    logros_obtenidos TEXT,
    FOREIGN KEY (usuario_id) REFERENCES User(user_id)
);
