"""LangGraph ReAct-style agent scaffold using a local Ollama model."""

import math
import operator
from typing import Annotated, TypedDict

from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.tools import tool
from langchain_ollama import ChatOllama
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode


@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression using Python math functions."""
    try:
        return str(eval(expression, {"__builtins__": {}}, vars(math)))
    except Exception as exc:
        return f"Error: {exc}"


@tool
def get_word_count(text: str) -> str:
    """Count words in text."""
    return str(len(text.split()))


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]


tools = [DuckDuckGoSearchRun(), calculator, get_word_count]
llm = ChatOllama(model="llama3.1:8b", temperature=0).bind_tools(tools)


def agent_node(state: AgentState) -> dict[str, list[BaseMessage]]:
    return {"messages": [llm.invoke(state["messages"])]}


def should_continue(state: AgentState) -> str:
    last = state["messages"][-1]
    if getattr(last, "tool_calls", None):
        return "tools"
    return END


graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", ToolNode(tools))
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue)
graph.add_edge("tools", "agent")
app = graph.compile()


if __name__ == "__main__":
    result = app.invoke({"messages": [HumanMessage(content="What is sqrt(193)?")]})
    print(result["messages"][-1].content)
