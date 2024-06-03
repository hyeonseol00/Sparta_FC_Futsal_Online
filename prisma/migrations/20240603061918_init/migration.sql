-- CreateTable
CREATE TABLE `user` (
    `user_id` VARCHAR(191) NOT NULL,
    `user_name` VARCHAR(191) NOT NULL,
    `user_pw` VARCHAR(191) NOT NULL,
    `cash` INTEGER NOT NULL DEFAULT 10000,

    UNIQUE INDEX `user_user_name_key`(`user_name`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `player` (
    `player_id` INTEGER NOT NULL AUTO_INCREMENT,
    `player_name` VARCHAR(191) NOT NULL,
    `speed` INTEGER NOT NULL,
    `goal_decision` INTEGER NOT NULL,
    `shoot_power` INTEGER NOT NULL,
    `defence` INTEGER NOT NULL,
    `stamina` INTEGER NOT NULL,

    PRIMARY KEY (`player_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `team` (
    `team_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `defender_id` INTEGER NOT NULL,
    `striker_id` INTEGER NOT NULL,
    `keeper_id` INTEGER NOT NULL,

    INDEX `team_defender_id_fkey`(`defender_id`),
    INDEX `team_keeper_id_fkey`(`keeper_id`),
    INDEX `team_striker_id_fkey`(`striker_id`),
    INDEX `team_user_id_fkey`(`user_id`),
    PRIMARY KEY (`team_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `record` (
    `user_id` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 1000,
    `win` INTEGER NOT NULL DEFAULT 0,
    `lose` INTEGER NOT NULL DEFAULT 0,
    `draw` INTEGER NOT NULL DEFAULT 0,
    `rank` INTEGER NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `owning_player` (
    `owning_player_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `player_id` INTEGER NOT NULL,
    `grade` INTEGER NOT NULL DEFAULT 1,
    `count` INTEGER NOT NULL DEFAULT 1,

    INDEX `owning_player_player_id_fkey`(`player_id`),
    INDEX `owning_player_user_id_fkey`(`user_id`),
    PRIMARY KEY (`owning_player_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `team` ADD CONSTRAINT `team_defender_id_fkey` FOREIGN KEY (`defender_id`) REFERENCES `owning_player`(`owning_player_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team` ADD CONSTRAINT `team_keeper_id_fkey` FOREIGN KEY (`keeper_id`) REFERENCES `owning_player`(`owning_player_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team` ADD CONSTRAINT `team_striker_id_fkey` FOREIGN KEY (`striker_id`) REFERENCES `owning_player`(`owning_player_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team` ADD CONSTRAINT `team_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `record` ADD CONSTRAINT `record_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `owning_player` ADD CONSTRAINT `owning_player_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `player`(`player_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `owning_player` ADD CONSTRAINT `owning_player_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
