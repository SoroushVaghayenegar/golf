import json
from dotenv import load_dotenv, find_dotenv
from lambda_function import lambda_handler


def main():
    # Load environment variables from nearest .env (searches up the tree)
    load_dotenv(find_dotenv())

    # Minimal local event
    event = {
        "queryStringParameters": {},
        "test": True,
    }

    response = lambda_handler(event, None)

    print("Status Code:", response.get("statusCode"))
    print("Headers:", response.get("headers"))
    print("Body:")
    try:
        print(json.dumps(json.loads(response.get("body", "{}")), indent=2))
    except Exception:
        print(response.get("body"))


if __name__ == "__main__":
    main()


