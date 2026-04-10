from ascend.application.context import Context


def handler(context: Context):
    messages = context.inputs["read_messages"]
    transactions = context.inputs["read_transactions"]

    # TODO: implement fraud risk scoring logic
    fraud_risk = transactions.copy()
    fraud_risk["risk_score"] = 0.0

    return fraud_risk
