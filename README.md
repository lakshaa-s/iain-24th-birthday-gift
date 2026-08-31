---
title: Book Recommender
emoji: 📚
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# Book Recommendation API

A content-based book recommendation engine built with FastAPI and SentenceTransformers. 
Created as a backend service for Iain's reading website.

## Endpoints

* `POST /recommend`: Accepts a book title and returns the top 5 semantically similar books.
* `GET /search`: Autocomplete endpoint for searching titles in the database.