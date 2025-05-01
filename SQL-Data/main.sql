CREATE DATABASE IF NOT EXISTS TMPDB;
USE TMPDB;

CREATE TABLE Team (
    team_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE User (
    user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    mail VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_pic BLOB,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    team_id INT,
    role INT NOT NULL DEFAULT 0,
    verification_token VARCHAR(64) NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    token_expires_at TIMESTAMP NULL,
    FOREIGN KEY (team_id) REFERENCES Team(team_id)
);

CREATE TABLE Tournament (
  tournament_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit INT NOT NULL
);
CREATE TABLE Tournament_Participation (
    user_id INT,
    tournament_id INT,
    score INT,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
);

CREATE TABLE Question(
    question_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255),
    language VARCHAR(255),
    topic VARCHAR(255),
    difficulty VARCHAR(255),
    tournament_id INT,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
);

CREATE TABLE Leaderboard(
    leaderboard_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(255),
    tournament_id INT,
    position INT,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (username) REFERENCES User(username),
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
);

CREATE TABLE Progress_Report (
    report_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    solved_problems INT,
    average_time INT,
    obtained_achievements INT,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);


CREATE TABLE Achievement (
    achievement_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255)
);

CREATE TABLE User_Achievement (
    user_id INT,
    achievement_id INT,
    obtained_date TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (achievement_id) REFERENCES Achievement(achievement_id)
);

INSERT INTO Achievement (name, description) VALUES
('First Tournament', 'Participate in your first tournament'),
('First Challenge Completed', 'Complete your first challenge'),
('Level 5 Reached', 'Reach level 5'),
('Top 5 Achiever', 'Be in the top 5 of the leaderboard'),
('Team Tournament', 'Participate in a team tournament');

