package com.isaithalam.repository;

import com.isaithalam.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface SongRepository extends JpaRepository<Song, Long> {
    List<Song> findByGenreIgnoreCase(String genre);
    List<Song> findTop10ByOrderByPlaysDesc();
    List<Song> findByFeaturedTrue();
    List<Song> findByLikedTrue();

    @Query("SELECT s FROM Song s WHERE LOWER(s.title) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(s.artistName) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(s.albumName) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<Song> search(String q);

    @Query("SELECT DISTINCT s.genre FROM Song s WHERE s.genre IS NOT NULL")
    List<String> findAllGenres();
}
