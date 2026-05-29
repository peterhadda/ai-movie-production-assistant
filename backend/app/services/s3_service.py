import json
import uuid

import boto3

from app.core.config import settings

_s3 = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
)


def upload_script(file_content: str, filename: str) -> str:
    key = f"scripts/{uuid.uuid4()}-{filename}"
    _s3.put_object(
        Bucket=settings.AWS_BUCKET_NAME,
        Key=key,
        Body=file_content.encode("utf-8"),
        ContentType="text/plain",
    )
    return key


def get_script(s3_key: str) -> str:
    response = _s3.get_object(Bucket=settings.AWS_BUCKET_NAME, Key=s3_key)
    return response["Body"].read().decode("utf-8")


def upload_result(data: dict, filename: str) -> str:
    key = f"results/{uuid.uuid4()}-{filename}"
    _s3.put_object(
        Bucket=settings.AWS_BUCKET_NAME,
        Key=key,
        Body=json.dumps(data, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )
    return key
