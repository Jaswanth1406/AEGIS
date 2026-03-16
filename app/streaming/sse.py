import asyncio
import json
from collections.abc import AsyncIterator


class ThreatEventBus:
    def __init__(self) -> None:
        self.subscribers: set[asyncio.Queue] = set()

    async def subscribe(self) -> AsyncIterator[str]:
        queue: asyncio.Queue = asyncio.Queue()
        self.subscribers.add(queue)
        try:
            while True:
                event = await queue.get()
                yield f"data: {json.dumps(event)}\\n\\n"
        finally:
            self.subscribers.discard(queue)

    async def publish(self, event: dict) -> None:
        for queue in list(self.subscribers):
            await queue.put(event)


threat_event_bus = ThreatEventBus()
