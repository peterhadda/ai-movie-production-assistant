"""Quick smoke-test for the S3 service. Delete after verifying."""
import sys
sys.path.insert(0, ".")

from app.services.s3_service import upload_script, get_script, upload_result

DUMMY_SCRIPT = "INT. COFFEE SHOP - DAY\nA screenwriter stares at a blank page."

print("Uploading script...")
key = upload_script(DUMMY_SCRIPT, "test_script.txt")
print(f"  uploaded → {key}")

print("Retrieving script...")
retrieved = get_script(key)
print(f"  retrieved → {retrieved!r}")
assert retrieved == DUMMY_SCRIPT, "MISMATCH — upload/download are broken"
print("  content matches ✓")

print("Uploading result...")
result_key = upload_result({"scene_count": 1, "genre": "drama"}, "test_result.json")
print(f"  uploaded → {result_key}")

print("\nAll S3 checks passed.")
