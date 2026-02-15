-- Artists
INSERT INTO artists (name, bio, image_url) VALUES
('Anirudh Ravichander', 'Indian film composer and singer known for Tamil cinema', '/images/artists/artist1.svg'),
('A.R. Rahman', 'Oscar-winning Indian composer, singer, and music producer', '/images/artists/artist2.svg'),
('Yuvan Shankar Raja', 'Indian film composer known for his work in Tamil cinema', '/images/artists/artist3.svg'),
('Sid Sriram', 'American-Indian singer and music composer', '/images/artists/artist4.svg'),
('Shreya Ghoshal', 'Indian playback singer with numerous awards', '/images/artists/artist5.svg');

-- Songs (using free sample audio from internet)
INSERT INTO songs (title, artist_name, album_name, genre, duration, audio_url, video_url, cover_image_url, plays, liked, featured) VALUES
('Neon Dreams', 'Anirudh Ravichander', 'Neon Nights', 'Pop', 234, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', NULL, '/images/covers/cover1.svg', 1250000, false, true),
('Midnight Raaga', 'A.R. Rahman', 'Soul Symphony', 'Classical Fusion', 312, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', NULL, '/images/covers/cover2.svg', 3400000, true, true),
('Kadhal Waves', 'Yuvan Shankar Raja', 'Ocean of Love', 'Romance', 267, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', NULL, '/images/covers/cover3.svg', 890000, false, false),
('Starlight Melody', 'Sid Sriram', 'Celestial', 'Indie', 198, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', NULL, '/images/covers/cover4.svg', 2100000, false, true),
('Thunder Beat', 'Anirudh Ravichander', 'Storm Rising', 'EDM', 245, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://www.w3schools.com/html/mov_bbb.mp4', '/images/covers/cover5.svg', 4500000, true, false),
('Whisper of Rain', 'Shreya Ghoshal', 'Monsoon Tales', 'Melody', 289, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', NULL, '/images/covers/cover6.svg', 1800000, false, false),
('Digital Pulse', 'Yuvan Shankar Raja', 'Cyber World', 'Electronic', 221, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', NULL, '/images/covers/cover7.svg', 960000, false, false),
('Velvet Voice', 'Sid Sriram', 'Silk Roads', 'R&B', 276, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', NULL, '/images/covers/cover8.svg', 1500000, true, true),
('Crystal Night', 'A.R. Rahman', 'Diamond Sky', 'World Music', 301, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', 'https://www.w3schools.com/html/mov_bbb.mp4', '/images/covers/cover9.svg', 5200000, false, true),
('Rhythm Fire', 'Anirudh Ravichander', 'Blaze', 'Hip Hop', 213, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', NULL, '/images/covers/cover10.svg', 3100000, false, false),
('Ocean Breeze', 'Shreya Ghoshal', 'Waves', 'Pop', 258, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', NULL, '/images/covers/cover11.svg', 750000, false, false),
('Golden Hour', 'Sid Sriram', 'Sunset Diaries', 'Indie', 242, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', NULL, '/images/covers/cover12.svg', 1900000, true, false),
('Electric Soul', 'Yuvan Shankar Raja', 'Voltage', 'Rock', 293, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', 'https://www.w3schools.com/html/mov_bbb.mp4', '/images/covers/cover13.svg', 2800000, false, true),
('Moonlit Dance', 'A.R. Rahman', 'Lunar', 'Classical Fusion', 334, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', NULL, '/images/covers/cover14.svg', 4100000, false, false),
('Urban Jungle', 'Anirudh Ravichander', 'City Lights', 'Hip Hop', 227, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', NULL, '/images/covers/cover15.svg', 1600000, false, false),
('Sakura Bloom', 'Shreya Ghoshal', 'Garden of Eden', 'Melody', 271, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', NULL, '/images/covers/cover16.svg', 680000, false, false);

-- Playlists
INSERT INTO playlists (name, user_id, cover_url, description) VALUES
('Trending Hits', 1, '/images/covers/cover1.svg', 'Top trending songs right now'),
('Chill Vibes', 1, '/images/covers/cover6.svg', 'Relax and unwind with soothing melodies'),
('Workout Energy', 1, '/images/covers/cover5.svg', 'High energy tracks for your workout');

-- Playlist songs
INSERT INTO playlist_songs (playlist_id, song_id) VALUES
(1, 1), (1, 2), (1, 5), (1, 9), (1, 10),
(2, 3), (2, 6), (2, 8), (2, 12), (2, 16),
(3, 5), (3, 7), (3, 10), (3, 13), (3, 15);
