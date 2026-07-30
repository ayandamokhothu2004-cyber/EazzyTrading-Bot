"""
Institutional Algorithmic Trading Bot - Core Order Management Module

High-performance, low-latency interface to the MetaTrader 5 (MT5) API for placing,
modifying, cancelling, and closing algorithmic trade orders and managing open positions.

Features:
- Standardized data structures for OrderRequest, OrderResult, and PositionInfo.
- Full support for Market, Limit, and Stop order execution.
- Exception handling and comprehensive MT5 retcode mapping.
- Position modifications (Stop Loss, Take Profit, Partial Closes).
- High-throughput execution logging with execution latency tracking.
- Fallback simulation bridge for testing environments without an active MT5 terminal.

PEP 8 compliant, fully typed, object-oriented design.
"""

from dataclasses import dataclass, field
from enum import Enum
import logging
import time
from typing import Dict, List, Optional, Tuple, Any

# Setup structured logger
logger = logging.getLogger("OrderManager")
logger.setLevel(logging.INFO)

# MetaTrader 5 conditional import for non-Windows / web sandbox support
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False
    mt5 = None


class OrderType(Enum):
    """Enumeration of standard order execution types."""
    BUY = "BUY"
    SELL = "SELL"
    BUY_LIMIT = "BUY_LIMIT"
    SELL_LIMIT = "SELL_LIMIT"
    BUY_STOP = "BUY_STOP"
    SELL_STOP = "SELL_STOP"


class OrderStatus(Enum):
    """Enumeration of order execution statuses."""
    PENDING = "PENDING"
    FILLED = "FILLED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    MODIFIED = "MODIFIED"


class FillingType(Enum):
    """Execution filling policies supported by MT5 brokers."""
    FOK = "FOK"  # Fill or Kill
    IOC = "IOC"  # Immediate or Cancel
    RETURN = "RETURN"  # Return remaining volume


@dataclass
class OrderRequest:
    """
    Standardized payload for placing or submitting order requests to MT5.
    
    Attributes:
        symbol (str): Instrument ticker (e.g. 'EURUSD', 'NAS100').
        order_type (OrderType): Type of trade order (BUY, SELL, BUY_LIMIT, etc.).
        volume (float): Order size in lots.
        price (Optional[float]): Target price (required for Limit/Stop orders; optional for Market).
        sl (Optional[float]): Stop Loss price.
        tp (Optional[float]): Take Profit price.
        deviation (int): Maximum allowable price slippage in points (default: 10).
        magic (int): Expert Advisor / Bot identification magic number.
        comment (str): Order description/label for trade journal tracking.
        filling_type (FillingType): Broker filling policy (default: IOC).
        expiration (Optional[int]): Expiration epoch timestamp for pending orders.
    """
    symbol: str
    order_type: OrderType
    volume: float
    price: Optional[float] = None
    sl: Optional[float] = None
    tp: Optional[float] = None
    deviation: int = 10
    magic: int = 202608
    comment: str = "QuantBot_Order"
    filling_type: FillingType = FillingType.IOC
    expiration: Optional[int] = None


@dataclass
class OrderResult:
    """
    Result wrapper returned after order submission or modification.
    
    Attributes:
        success (bool): True if order was filled or accepted by broker.
        retcode (int): MetaTrader 5 return code integer.
        retcode_desc (str): Human-readable return code description.
        order_ticket (int): MT5 order ticket identifier.
        deal_ticket (int): MT5 deal ticket identifier (for filled market orders).
        volume (float): Executed lot volume.
        price (float): Execution price confirmed by MT5 server.
        bid (float): Market bid price at time of execution.
        ask (float): Market ask price at time of execution.
        latency_ms (float): Execution latency measured in milliseconds.
        comment (str): Broker execution comment or error message.
        request (Optional[OrderRequest]): Original request object.
        timestamp (float): UNIX epoch timestamp of execution result.
    """
    success: bool
    retcode: int
    retcode_desc: str
    order_ticket: int = 0
    deal_ticket: int = 0
    volume: float = 0.0
    price: float = 0.0
    bid: float = 0.0
    ask: float = 0.0
    latency_ms: float = 0.0
    comment: str = ""
    request: Optional[OrderRequest] = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class PositionInfo:
    """
    Data structure representing an active open position on MetaTrader 5.
    
    Attributes:
        ticket (int): Unique position ticket.
        symbol (str): Instrument symbol.
        order_type (OrderType): BUY or SELL.
        volume (float): Current open lot size.
        price_open (float): Average entry price.
        sl (float): Current Stop Loss price.
        tp (float): Current Take Profit price.
        price_current (float): Live market price.
        profit (float): Unrealized profit/loss in account currency.
        magic (int): Magic number associated with order.
        comment (str): Order comment.
        time_setup (float): Timestamp position was opened.
    """
    ticket: int
    symbol: str
    order_type: OrderType
    volume: float
    price_open: float
    sl: float
    tp: float
    price_current: float
    profit: float
    magic: int
    comment: str
    time_setup: float


class OrderManager:
    """
    Core Order Management Module for MetaTrader 5 API interface.
    
    Provides ultra low-latency order execution, position tracking, order modifications,
    cancellations, partial closes, and error recovery retcode parsing.
    """

    # Comprehensive MT5 Return Code Dictionary Mapping
    RETCODE_MAP: Dict[int, str] = {
        10004: "TRADE_RETCODE_REQUOTE - Requote required",
        10006: "TRADE_RETCODE_REJECT - Request rejected by broker",
        10007: "TRADE_RETCODE_CANCEL - Request cancelled by trader",
        10008: "TRADE_RETCODE_PLACED - Order placed in system",
        10009: "TRADE_RETCODE_DONE - Request completed successfully",
        10010: "TRADE_RETCODE_DONE_PARTIAL - Request partially filled",
        10011: "TRADE_RETCODE_ERROR - Order processing error",
        10012: "TRADE_RETCODE_TIMEOUT - Request timed out",
        10013: "TRADE_RETCODE_INVALID - Invalid request structure",
        10014: "TRADE_RETCODE_INVALID_VOLUME - Invalid lot volume",
        10015: "TRADE_RETCODE_INVALID_PRICE - Invalid price specified",
        10016: "TRADE_RETCODE_INVALID_STOPS - Invalid Stop Loss or Take Profit levels",
        10017: "TRADE_RETCODE_TRADE_DISABLED - Trading is disabled for account/symbol",
        10018: "TRADE_RETCODE_MARKET_CLOSED - Market is closed",
        10019: "TRADE_RETCODE_NO_MONEY - Insufficient funds/margin",
        10020: "TRADE_RETCODE_PRICE_CHANGED - Prices changed during request",
        10021: "TRADE_RETCODE_PRICE_OFF - No quotes available",
        10022: "TRADE_RETCODE_INVALID_EXPIRATION - Invalid order expiration",
        10023: "TRADE_RETCODE_ORDER_CHANGED - Order state changed",
        10024: "TRADE_RETCODE_TOO_MANY_REQUESTS - Too many API requests (rate limited)",
        10025: "TRADE_RETCODE_NO_CHANGES - No changes in request parameters",
        10026: "TRADE_RETCODE_SERVER_DISABLE_AT - Autotrading disabled by server",
        10027: "TRADE_RETCODE_CLIENT_DISABLE_AT - Autotrading disabled by MT5 client terminal"
    }

    def __init__(
        self,
        default_magic: int = 202608,
        default_deviation: int = 10,
        simulation_mode: bool = not MT5_AVAILABLE
    ) -> None:
        """
        Initializes the OrderManager module.
        
        Args:
            default_magic (int): Default magic number for tracking bot orders.
            default_deviation (int): Maximum allowed slippage in points.
            simulation_mode (bool): If True, fallback to low-latency mock execution engine.
        """
        self.default_magic = default_magic
        self.default_deviation = default_deviation
        self.simulation_mode = simulation_mode or not MT5_AVAILABLE
        self._simulated_positions: Dict[int, PositionInfo] = {}
        self._simulated_ticket_counter = 98000

        logger.info(
            f"OrderManager Initialized | Mode: {'SIMULATION / TEST BRIDGE' if self.simulation_mode else 'LIVE MT5 TERMINAL'} "
            f"| Magic: {self.default_magic} | Default Deviation: {self.default_deviation} points"
        )

    # =========================================================================
    # PRIMARY ORDER EXECUTION METHODS
    # =========================================================================

    def place_order(self, request: OrderRequest) -> OrderResult:
        """
        Submits an order request to MetaTrader 5 API or simulation bridge.
        
        Args:
            request (OrderRequest): Order details including symbol, type, size, SL, TP, etc.
            
        Returns:
            OrderResult: Detailed execution status, ticket, price, latency, and retcode.
        """
        start_time = time.perf_counter()

        # Input Validation
        validation_error = self._validate_request(request)
        if validation_error:
            logger.error(f"Order Request Validation Failed: {validation_error}")
            return OrderResult(
                success=False,
                retcode=10013,
                retcode_desc=f"TRADE_RETCODE_INVALID - {validation_error}",
                comment=validation_error,
                request=request,
                latency_ms=(time.perf_counter() - start_time) * 1000
            )

        if self.simulation_mode:
            return self._execute_simulated_order(request, start_time)

        # MetaTrader 5 Direct API Call
        try:
            mt5_action, mt5_type = self._map_order_type_to_mt5(request.order_type)
            mt5_filling = self._map_filling_type_to_mt5(request.filling_type)

            # Get latest symbol tick for market orders if price not explicitly provided
            price = request.price
            if price is None or price <= 0:
                tick = mt5.symbol_info_tick(request.symbol)
                if not tick:
                    logger.error(f"Failed to fetch tick quotes for symbol {request.symbol}")
                    return OrderResult(
                        success=False,
                        retcode=10021,
                        retcode_desc=self.RETCODE_MAP.get(10021, "PRICE_OFF"),
                        comment="Failed to retrieve live market quotes",
                        request=request,
                        latency_ms=(time.perf_counter() - start_time) * 1000
                    )
                price = tick.ask if request.order_type in [OrderType.BUY, OrderType.BUY_LIMIT, OrderType.BUY_STOP] else tick.bid

            # Build MT5 structure
            mt5_req = {
                "action": mt5_action,
                "symbol": request.symbol,
                "volume": request.volume,
                "type": mt5_type,
                "price": price,
                "sl": request.sl if request.sl is not None else 0.0,
                "tp": request.tp if request.tp is not None else 0.0,
                "deviation": request.deviation or self.default_deviation,
                "magic": request.magic or self.default_magic,
                "comment": request.comment[:31],
                "type_filling": mt5_filling,
            }

            if request.expiration:
                mt5_req["type_time"] = mt5.ORDER_TIME_SPECIFIED
                mt5_req["expiration"] = request.expiration
            else:
                mt5_req["type_time"] = mt5.ORDER_TIME_GTC

            # Dispatch order send to MT5
            res = mt5.order_send(mt5_req)
            elapsed_ms = (time.perf_counter() - start_time) * 1000

            if res is None:
                last_err = mt5.last_error()
                logger.error(f"mt5.order_send returned None. Terminal Last Error: {last_err}")
                return OrderResult(
                    success=False,
                    retcode=10011,
                    retcode_desc=f"MT5 API Exception: {last_err}",
                    comment="MT5 order_send call failed to receive response",
                    request=request,
                    latency_ms=elapsed_ms
                )

            ret_desc = self.parse_retcode(res.retcode)
            is_success = res.retcode in [mt5.TRADE_RETCODE_DONE, mt5.TRADE_RETCODE_PLACED]

            result = OrderResult(
                success=is_success,
                retcode=res.retcode,
                retcode_desc=ret_desc,
                order_ticket=res.order,
                deal_ticket=res.deal,
                volume=res.volume,
                price=res.price,
                bid=res.bid,
                ask=res.ask,
                latency_ms=elapsed_ms,
                comment=res.comment,
                request=request
            )

            if is_success:
                logger.info(
                    f"[ORDER FILLED] Ticket: {res.order} | {request.order_type.value} {res.volume} {request.symbol} "
                    f"@ {res.price:.5f} | SL: {request.sl} | TP: {request.tp} | Latency: {elapsed_ms:.2f}ms"
                )
            else:
                logger.warning(
                    f"[ORDER REJECTED] Symbol: {request.symbol} | Retcode: {res.retcode} ({ret_desc}) | Comment: {res.comment}"
                )

            return result

        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            logger.exception(f"Unhandled exception during order placement: {str(e)}")
            return OrderResult(
                success=False,
                retcode=10011,
                retcode_desc=f"EXCEPTION: {str(e)}",
                comment=str(e),
                request=request,
                latency_ms=elapsed_ms
            )

    def place_market_order(
        self,
        symbol: str,
        order_type: OrderType,
        volume: float,
        sl: Optional[float] = None,
        tp: Optional[float] = None,
        comment: str = "Market_Order"
    ) -> OrderResult:
        """
        Helper method to place an immediate market BUY or SELL order.
        """
        req = OrderRequest(
            symbol=symbol,
            order_type=order_type,
            volume=volume,
            sl=sl,
            tp=tp,
            magic=self.default_magic,
            comment=comment
        )
        return self.place_order(req)

    def place_limit_order(
        self,
        symbol: str,
        order_type: OrderType,
        price: float,
        volume: float,
        sl: Optional[float] = None,
        tp: Optional[float] = None,
        comment: str = "Limit_Order"
    ) -> OrderResult:
        """
        Helper method to place a BUY_LIMIT or SELL_LIMIT pending order.
        """
        req = OrderRequest(
            symbol=symbol,
            order_type=order_type,
            price=price,
            volume=volume,
            sl=sl,
            tp=tp,
            magic=self.default_magic,
            comment=comment
        )
        return self.place_order(req)

    # =========================================================================
    # POSITION AND ORDER MODIFICATIONS
    # =========================================================================

    def modify_position(
        self,
        ticket: int,
        sl: Optional[float] = None,
        tp: Optional[float] = None
    ) -> OrderResult:
        """
        Modifies Stop Loss and/or Take Profit levels for an existing open position.
        
        Args:
            ticket (int): MT5 position ticket number.
            sl (Optional[float]): New Stop Loss price.
            tp (Optional[float]): New Take Profit price.
            
        Returns:
            OrderResult: Modification result status.
        """
        start_time = time.perf_counter()

        if self.simulation_mode:
            if ticket in self._simulated_positions:
                pos = self._simulated_positions[ticket]
                if sl is not None:
                    pos.sl = sl
                if tp is not None:
                    pos.tp = tp
                logger.info(f"[SIM MODIFIED] Ticket: {ticket} | SL set to: {sl} | TP set to: {tp}")
                return OrderResult(
                    success=True,
                    retcode=10009,
                    retcode_desc=self.parse_retcode(10009),
                    order_ticket=ticket,
                    latency_ms=(time.perf_counter() - start_time) * 1000,
                    comment="Simulated position modified successfully"
                )
            return OrderResult(
                success=False,
                retcode=10013,
                retcode_desc="Position Ticket Not Found",
                order_ticket=ticket,
                latency_ms=(time.perf_counter() - start_time) * 1000
            )

        try:
            positions = mt5.positions_get(ticket=ticket)
            if not positions or len(positions) == 0:
                logger.error(f"Cannot modify position: Ticket {ticket} not found on MT5 terminal.")
                return OrderResult(
                    success=False,
                    retcode=10013,
                    retcode_desc="Position Ticket Not Found",
                    order_ticket=ticket,
                    latency_ms=(time.perf_counter() - start_time) * 1000
                )

            pos = positions[0]
            req = {
                "action": mt5.TRADE_ACTION_SLTP,
                "position": ticket,
                "symbol": pos.symbol,
                "sl": sl if sl is not None else pos.sl,
                "tp": tp if tp is not None else pos.tp,
                "magic": pos.magic
            }

            res = mt5.order_send(req)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            is_success = res is not None and res.retcode == mt5.TRADE_RETCODE_DONE

            ret_code = res.retcode if res else 10011
            ret_desc = self.parse_retcode(ret_code)

            if is_success:
                logger.info(f"[POSITION MODIFIED] Ticket {ticket} | New SL: {sl} | New TP: {tp}")
            else:
                logger.warning(f"[MODIFY FAILED] Ticket {ticket} | Retcode: {ret_code} ({ret_desc})")

            return OrderResult(
                success=is_success,
                retcode=ret_code,
                retcode_desc=ret_desc,
                order_ticket=ticket,
                latency_ms=elapsed_ms,
                comment=res.comment if res else "No response from MT5"
            )

        except Exception as e:
            logger.exception(f"Error modifying position {ticket}: {e}")
            return OrderResult(
                success=False,
                retcode=10011,
                retcode_desc=str(e),
                order_ticket=ticket,
                latency_ms=(time.perf_counter() - start_time) * 1000
            )

    def cancel_order(self, ticket: int) -> OrderResult:
        """
        Cancels a pending limit or stop order by ticket.
        
        Args:
            ticket (int): Pending order ticket identifier.
        """
        start_time = time.perf_counter()

        if self.simulation_mode:
            logger.info(f"[SIM CANCELLED] Pending Order Ticket: {ticket}")
            return OrderResult(
                success=True,
                retcode=10009,
                retcode_desc=self.parse_retcode(10009),
                order_ticket=ticket,
                latency_ms=(time.perf_counter() - start_time) * 1000,
                comment="Pending order cancelled in simulation"
            )

        try:
            req = {
                "action": mt5.TRADE_ACTION_REMOVE,
                "order": ticket
            }
            res = mt5.order_send(req)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            is_success = res is not None and res.retcode == mt5.TRADE_RETCODE_DONE

            ret_code = res.retcode if res else 10011
            ret_desc = self.parse_retcode(ret_code)

            if is_success:
                logger.info(f"[ORDER CANCELLED] Pending Order Ticket {ticket} removed.")
            else:
                logger.warning(f"[CANCEL FAILED] Ticket {ticket} | Retcode: {ret_code} ({ret_desc})")

            return OrderResult(
                success=is_success,
                retcode=ret_code,
                retcode_desc=ret_desc,
                order_ticket=ticket,
                latency_ms=elapsed_ms,
                comment=res.comment if res else "No response"
            )

        except Exception as e:
            logger.exception(f"Error cancelling order {ticket}: {e}")
            return OrderResult(
                success=False,
                retcode=10011,
                retcode_desc=str(e),
                order_ticket=ticket,
                latency_ms=(time.perf_counter() - start_time) * 1000
            )

    def close_position(self, ticket: int, volume: Optional[float] = None) -> OrderResult:
        """
        Closes an active position (partially or fully) by sending an opposing deal order.
        
        Args:
            ticket (int): MT5 position ticket number.
            volume (Optional[float]): Volume to close. If None, closes full position volume.
        """
        start_time = time.perf_counter()

        if self.simulation_mode:
            if ticket in self._simulated_positions:
                pos = self._simulated_positions[ticket]
                close_vol = volume if volume and volume < pos.volume else pos.volume
                pos.volume -= close_vol
                if pos.volume <= 0.001:
                    del self._simulated_positions[ticket]
                logger.info(f"[SIM CLOSED] Ticket {ticket} | Closed Vol: {close_vol} | Remaining: {pos.volume}")
                return OrderResult(
                    success=True,
                    retcode=10009,
                    retcode_desc=self.parse_retcode(10009),
                    order_ticket=ticket,
                    volume=close_vol,
                    latency_ms=(time.perf_counter() - start_time) * 1000,
                    comment="Simulated position closed successfully"
                )
            return OrderResult(
                success=False,
                retcode=10013,
                retcode_desc="Position Ticket Not Found",
                order_ticket=ticket,
                latency_ms=(time.perf_counter() - start_time) * 1000
            )

        try:
            positions = mt5.positions_get(ticket=ticket)
            if not positions:
                return OrderResult(
                    success=False,
                    retcode=10013,
                    retcode_desc="Position Ticket Not Found",
                    order_ticket=ticket,
                    latency_ms=(time.perf_counter() - start_time) * 1000
                )

            pos = positions[0]
            close_vol = volume if (volume and volume < pos.volume) else pos.volume

            # Determine opposing trade action
            close_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY
            tick = mt5.symbol_info_tick(pos.symbol)
            price = tick.bid if close_type == mt5.ORDER_TYPE_SELL else tick.ask

            req = {
                "action": mt5.TRADE_ACTION_DEAL,
                "position": ticket,
                "symbol": pos.symbol,
                "volume": close_vol,
                "type": close_type,
                "price": price,
                "deviation": self.default_deviation,
                "magic": pos.magic,
                "comment": f"Close_{ticket}",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }

            res = mt5.order_send(req)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            is_success = res is not None and res.retcode == mt5.TRADE_RETCODE_DONE

            ret_code = res.retcode if res else 10011
            ret_desc = self.parse_retcode(ret_code)

            if is_success:
                logger.info(f"[POSITION CLOSED] Ticket {ticket} | Closed Vol: {close_vol} @ {res.price:.5f}")
            else:
                logger.warning(f"[CLOSE FAILED] Ticket {ticket} | Retcode: {ret_code} ({ret_desc})")

            return OrderResult(
                success=is_success,
                retcode=ret_code,
                retcode_desc=ret_desc,
                order_ticket=ticket,
                deal_ticket=res.deal if res else 0,
                volume=close_vol,
                price=res.price if res else price,
                latency_ms=elapsed_ms,
                comment=res.comment if res else "No MT5 response"
            )

        except Exception as e:
            logger.exception(f"Error closing position {ticket}: {e}")
            return OrderResult(
                success=False,
                retcode=10011,
                retcode_desc=str(e),
                order_ticket=ticket,
                latency_ms=(time.perf_counter() - start_time) * 1000
            )

    # =========================================================================
    # QUERY & INSPECTION METHODS
    # =========================================================================

    def get_open_positions(self, symbol: Optional[str] = None) -> List[PositionInfo]:
        """
        Retrieves active open positions filtering by symbol if provided.
        """
        if self.simulation_mode:
            pos_list = list(self._simulated_positions.values())
            if symbol:
                pos_list = [p for p in pos_list if p.symbol == symbol]
            return pos_list

        try:
            positions = mt5.positions_get(symbol=symbol) if symbol else mt5.positions_get()
            if not positions:
                return []

            result = []
            for p in positions:
                order_type = OrderType.BUY if p.type == mt5.POSITION_TYPE_BUY else OrderType.SELL
                info = PositionInfo(
                    ticket=p.ticket,
                    symbol=p.symbol,
                    order_type=order_type,
                    volume=p.volume,
                    price_open=p.price_open,
                    sl=p.sl,
                    tp=p.tp,
                    price_current=p.price_current,
                    profit=p.profit,
                    magic=p.magic,
                    comment=p.comment,
                    time_setup=p.time
                )
                result.append(info)
            return result

        except Exception as e:
            logger.error(f"Error fetching open positions from MT5: {e}")
            return []

    def parse_retcode(self, retcode: int) -> str:
        """
        Translates MT5 numerical return codes into human-readable descriptions.
        """
        return self.RETCODE_MAP.get(retcode, f"UNKNOWN_RETCODE_{retcode}")

    # =========================================================================
    # PRIVATE HELPER METHODS
    # =========================================================================

    def _validate_request(self, req: OrderRequest) -> Optional[str]:
        """Validates mandatory fields on OrderRequest prior to API dispatch."""
        if not req.symbol or not isinstance(req.symbol, str):
            return "Invalid instrument symbol"
        if req.volume <= 0.0:
            return f"Invalid order volume: {req.volume} (must be > 0.0)"
        if req.order_type in [OrderType.BUY_LIMIT, OrderType.SELL_LIMIT, OrderType.BUY_STOP, OrderType.SELL_STOP]:
            if req.price is None or req.price <= 0:
                return f"Pending order type {req.order_type.value} requires valid positive price"
        return None

    def _map_order_type_to_mt5(self, o_type: OrderType) -> Tuple[int, int]:
        """Maps internal OrderType to MT5 trade action and order type integers."""
        if o_type == OrderType.BUY:
            return (mt5.TRADE_ACTION_DEAL, mt5.ORDER_TYPE_BUY)
        elif o_type == OrderType.SELL:
            return (mt5.TRADE_ACTION_DEAL, mt5.ORDER_TYPE_SELL)
        elif o_type == OrderType.BUY_LIMIT:
            return (mt5.TRADE_ACTION_PENDING, mt5.ORDER_TYPE_BUY_LIMIT)
        elif o_type == OrderType.SELL_LIMIT:
            return (mt5.TRADE_ACTION_PENDING, mt5.ORDER_TYPE_SELL_LIMIT)
        elif o_type == OrderType.BUY_STOP:
            return (mt5.TRADE_ACTION_PENDING, mt5.ORDER_TYPE_BUY_STOP)
        elif o_type == OrderType.SELL_STOP:
            return (mt5.TRADE_ACTION_PENDING, mt5.ORDER_TYPE_SELL_STOP)
        else:
            raise ValueError(f"Unsupported OrderType: {o_type}")

    def _map_filling_type_to_mt5(self, f_type: FillingType) -> int:
        """Maps internal FillingType to MT5 filling mode integer."""
        if not MT5_AVAILABLE:
            return 0
        if f_type == FillingType.FOK:
            return mt5.ORDER_FILLING_FOK
        elif f_type == FillingType.IOC:
            return mt5.ORDER_FILLING_IOC
        else:
            return mt5.ORDER_FILLING_RETURN

    def _execute_simulated_order(self, request: OrderRequest, start_time: float) -> OrderResult:
        """Low-latency fallback simulation order execution engine."""
        self._simulated_ticket_counter += 1
        ticket = self._simulated_ticket_counter
        sim_price = request.price if request.price else (1.08642 if "EUR" in request.symbol else 18542.50)

        # Register position
        pos = PositionInfo(
            ticket=ticket,
            symbol=request.symbol,
            order_type=request.order_type,
            volume=request.volume,
            price_open=sim_price,
            sl=request.sl or 0.0,
            tp=request.tp or 0.0,
            price_current=sim_price,
            profit=0.0,
            magic=request.magic,
            comment=request.comment,
            time_setup=time.time()
        )
        self._simulated_positions[ticket] = pos

        latency = (time.perf_counter() - start_time) * 1000 + 1.2  # Simulate ~1.2ms ultra-low latency execution
        logger.info(
            f"[SIM EXECUTION] Ticket: {ticket} | {request.order_type.value} {request.volume} {request.symbol} "
            f"@ {sim_price:.5f} | SL: {request.sl} | TP: {request.tp} | Latency: {latency:.2f}ms"
        )

        return OrderResult(
            success=True,
            retcode=10009,
            retcode_desc=self.parse_retcode(10009),
            order_ticket=ticket,
            deal_ticket=ticket + 500000,
            volume=request.volume,
            price=sim_price,
            bid=sim_price - 0.00006,
            ask=sim_price,
            latency_ms=latency,
            comment="Simulated Execution Success (12ms bridge)",
            request=request
        )


if __name__ == "__main__":
    # Test suite demonstration
    om = OrderManager(simulation_mode=True)
    
    print("--- Testing Market Buy Order Placement ---")
    market_res = om.place_market_order(
        symbol="EURUSD",
        order_type=OrderType.BUY,
        volume=2.5,
        sl=1.08380,
        tp=1.08800,
        comment="Model A Entry"
    )
    print("Result:", market_res)

    print("\n--- Testing Position Modification ---")
    mod_res = om.modify_position(market_res.order_ticket, sl=1.08520, tp=1.09100)
    print("Result:", mod_res)

    print("\n--- Testing Open Positions Listing ---")
    positions = om.get_open_positions()
    print("Open Positions:", positions)

    print("\n--- Testing Position Closing ---")
    close_res = om.close_position(market_res.order_ticket)
    print("Result:", close_res)
