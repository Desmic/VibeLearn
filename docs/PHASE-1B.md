# Phase 1B checkpoint — verified

`python manage.py build`: passed. `python manage.py test`: 16 tests passed.
`python manage.py browser`: save/reload/restart/keyboard/narrow checks retained;
submission, evidence capsule inspection, correct trace feedback, future review,
and recap reload passed through real UI/HTTP/SQLite. Screenshot: phase1b-recap.png.

Schema 3 adds immutable-in-application submission checkpoints and evidence capsules,
plus learner/frame retrieval needs without course or lesson ownership. Every capsule
retains the exact task, frame, binding, rubric, policies, response and aid conditions.
Deterministic grading checks only three trace counts; reasoning remains not observed.
Malformed/missing answers cannot become a failed score. Provisional partial evidence
cannot establish mastery. No educational validity or human content acceptance claimed.

No blocked Phase 1B gate. Recovery: restart same DB, preserve the entire data folder;
older application versions refuse a newer DB. Next: explicit aid checkpoints, mode
boundaries, source gates, failure recovery and one deduplicated practice reward.
