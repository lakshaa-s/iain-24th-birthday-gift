import json
import re
from pathlib import Path

# Resolve paths relative to project root regardless of where the script is executed
PROJECT_ROOT = Path(__file__).resolve().parents[1]
INPUT_FILE = PROJECT_ROOT / "data" / "raw" / "books.jsonl"
OUTPUT_FILE = PROJECT_ROOT / "data" / "processed" / "books_clean.jsonl"


def clean_text(text):
    """Basic text cleaning and whitespace normalization."""
    if not text:
        return ""
    text = str(text)
    return re.sub(r"\s+", " ", text).strip()


def clean_subjects(subjects):
    """Remove noisy Open Library metadata subjects."""
    if not subjects:
        return []

    cleaned = []
    noise_filter = {
        "general",
        "novela",
        "romans, nouvelles",
        "étudiants",
        "estudiantes universitarios",
        "asesinato",
        "meurtre",
        "meurtriers",
    }

    for subject in subjects:
        subject_clean = clean_text(subject)
        if not subject_clean:
            continue

        subj_lower = subject_clean.lower()
        if "language materials" in subj_lower or subj_lower.startswith("nyt:"):
            continue

        if subj_lower in noise_filter:
            continue

        cleaned.append(subject_clean)

    return list(dict.fromkeys(cleaned))


def create_combined_text(book):
    """Create dense text representation used for embeddings."""
    title = book.get("title", "")
    authors = " ".join(book.get("author_names", []) or [])
    description = book.get("description", "")
    subjects = " ".join(book.get("subjects", []))
    places = " ".join(clean_text(x) for x in book.get("subject_places", []))
    times = " ".join(clean_text(x) for x in book.get("subject_times", []))
    people = " ".join(clean_text(x) for x in book.get("subject_people", []))

    combined = f"{title} {authors} {description} {subjects} {places} {times} {people}"
    return clean_text(combined)


def clean_dataset():
    if not INPUT_FILE.exists():
        print(f"Error: Input file not found at {INPUT_FILE}")
        return

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    seen_works = set()
    cleaned_books = []

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue

            book = json.loads(line)

            # Deduplicate by work_id immediately
            work_id = book.get("work_id")
            if not work_id or work_id in seen_works:
                continue

            # Require a title
            title = clean_text(book.get("title"))
            if not title:
                continue

            seen_works.add(work_id)

            book["title"] = title
            book["description"] = clean_text(book.get("description"))
            book["subjects"] = clean_subjects(book.get("subjects", []))
            book["combined_text"] = create_combined_text(book)

            cleaned_books.append(book)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for book in cleaned_books:
            f.write(json.dumps(book, ensure_ascii=False) + "\n")

    print(f"Processed {len(cleaned_books)} unique books.")
    print(f"Saved cleaned dataset to: {OUTPUT_FILE}")


if __name__ == "__main__":
    clean_dataset()