import requests
import json
import time
from pathlib import Path


BASE_URL = "https://openlibrary.org"
OUTPUT_FILE = Path("data/raw/books.jsonl")

SUBJECTS = [
    "fiction",
    "fantasy",
    "romance",
    "mystery_and_detective_stories",
    "science_fiction",
    "horror",
    "thriller",
    "historical_fiction",
    "young_adult_fiction",
    "literary_fiction",
]


def get_subject_works(subject, limit=100):
    """Get works belonging to an Open Library subject."""

    url = f"{BASE_URL}/subjects/{subject}.json"

    params = {
        "limit": limit
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    return response.json().get("works", [])


def get_work(work_id):
    """Retrieve detailed information about an Open Library work."""

    url = f"{BASE_URL}/works/{work_id}.json"

    response = requests.get(url)
    response.raise_for_status()

    return response.json()


def extract_work_data(work):
    """Extract the fields needed by our recommender."""

    work_id = work.get("key", "").replace("/works/", "")

    authors = []

    for author in work.get("authors", []):
        author_key = author.get("author", {}).get("key")

        if author_key:
            authors.append(author_key.replace("/authors/", ""))

    description = work.get("description")

    if isinstance(description, dict):
        description = description.get("value", "")

    return {
        "work_id": work_id,
        "title": work.get("title"),
        "description": description,
        "subjects": work.get("subjects", []),
        "subject_places": work.get("subject_places", []),
        "subject_times": work.get("subject_times", []),
        "subject_people": work.get("subject_people", []),
        "authors": authors,
        "covers": work.get("covers", [])
    }


def collect_books():

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # First collect unique work IDs
    work_ids = set()

    print("Collecting work IDs...")

    for subject in SUBJECTS:

        print(f"  Searching subject: {subject}")

        works = get_subject_works(subject, limit=100)

        for work in works:
            work_id = work.get("key", "").replace("/works/", "")

            if work_id:
                work_ids.add(work_id)

    print(f"\nFound {len(work_ids)} unique works.")

    # Retrieve detailed information
    books = []

    for i, work_id in enumerate(work_ids, start=1):

        try:

            work = get_work(work_id)
            book = extract_work_data(work)

            books.append(book)

            print(
                f"[{i}/{len(work_ids)}] "
                f"{book['title']}"
            )

            # Be polite to the API
            time.sleep(0.1)

        except requests.RequestException as e:

            print(
                f"Failed to retrieve {work_id}: {e}"
            )

    # Save as JSON Lines
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:

        for book in books:
            f.write(
                json.dumps(
                    book,
                    ensure_ascii=False
                ) + "\n"
            )

    print(f"\nSaved {len(books)} books to {OUTPUT_FILE}")


if __name__ == "__main__":
    collect_books()