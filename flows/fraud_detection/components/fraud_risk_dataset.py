import pandas as pd

from ascend.application.context import ComponentExecutionContext
from ascend.resources import ref, test, transform


@transform(
    inputs=[
        ref("read_transactions"),
        ref("read_messages"),
    ],
    input_data_format="pandas",
    tests=[
        test("not_null", column="user_id"),
        test("not_null", column="transaction_id"),
        test("not_null", column="message_id"),
        test("not_null", column="overall_risk_score"),
        test("not_null", column="requires_immediate_review"),
        test("not_null", column="risk_reason"),
        test("count_greater_than", count=0),
    ],
)
def fraud_risk_dataset(
    read_transactions: pd.DataFrame,
    read_messages: pd.DataFrame,
    context: ComponentExecutionContext,
) -> pd.DataFrame:
    transactions = read_transactions.copy()
    messages = read_messages.copy()

    transactions["amount"] = pd.to_numeric(transactions["amount"], errors="coerce")
    transactions["is_new_recipient"] = transactions["is_new_recipient"].astype(str).str.lower() == "true"

    message_text = messages["message_text"].fillna("").str.lower()
    high_message = message_text.str.contains("urgent|wire|immediately|payment", regex=True)
    medium_message = message_text.str.contains("verify|action required", regex=True)
    messages["message_risk_flag"] = "LOW"
    messages.loc[medium_message, "message_risk_flag"] = "MEDIUM"
    messages.loc[high_message, "message_risk_flag"] = "HIGH"

    transactions["transaction_risk_flag"] = "LOW"
    medium_transaction = transactions["amount"].between(300, 1000, inclusive="both")
    high_transaction = (transactions["amount"] > 1000) & transactions["is_new_recipient"]
    transactions.loc[medium_transaction, "transaction_risk_flag"] = "MEDIUM"
    transactions.loc[high_transaction, "transaction_risk_flag"] = "HIGH"

    joined = transactions.merge(messages, on="user_id", how="inner", suffixes=("_transaction", "_message"))

    joined["overall_risk_score"] = "LOW"
    both_high = (
        (joined["message_risk_flag"] == "HIGH")
        & (joined["transaction_risk_flag"] == "HIGH")
    )
    one_high_or_both_medium = (
        ((joined["message_risk_flag"] == "HIGH") | (joined["transaction_risk_flag"] == "HIGH"))
        | ((joined["message_risk_flag"] == "MEDIUM") & (joined["transaction_risk_flag"] == "MEDIUM"))
    )
    joined.loc[one_high_or_both_medium, "overall_risk_score"] = "MEDIUM"
    joined.loc[both_high, "overall_risk_score"] = "HIGH"
    joined["requires_immediate_review"] = joined["overall_risk_score"] == "HIGH"
    joined["risk_reason"] = "Normal activity"
    joined.loc[joined["message_risk_flag"] == "HIGH", "risk_reason"] = "Suspicious or urgent language detected"
    joined.loc[joined["transaction_risk_flag"] == "HIGH", "risk_reason"] = "High-value transaction with new recipient"
    joined.loc[both_high, "risk_reason"] = "High-risk transaction + suspicious messaging"

    return joined[
        [
            "user_id",
            "transaction_id",
            "message_id",
            "amount",
            "message_text",
            "transaction_risk_flag",
            "message_risk_flag",
            "overall_risk_score",
            "requires_immediate_review",
            "risk_reason",
        ]
    ]
