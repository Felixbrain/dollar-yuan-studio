import requests

dollars = float(input("How many US dollars? "))

response = requests.get(
    "https://api.frankfurter.dev/v2/rate/USD/CNY"
)

data = response.json()
rate = data["rate"]

yuan = dollars * rate

print("Exchange rate:", rate)
print("Rate date:", data["date"])
print("Your money in RMB:", round(yuan, 2))