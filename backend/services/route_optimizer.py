"""
Route Optimization Service
Uses Google OR-Tools to solve the Traveling Salesman Problem (TSP)
for optimizing driver routes.
"""

from typing import List, Dict, Optional
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def optimize_route(
    offices: List[Dict],
    shipments: Optional[List[Dict]] = None
) -> Dict:
    """
    Optimize route using TSP solver
    
    Args:
        offices: List of office dicts with 'id', 'name', 'coordinates' (lat/lng)
        shipments: Optional list of shipments to consider for urgency/package counts
    
    Returns:
        Dict with:
            - waypoints: List of optimized office IDs in order
            - estimated_duration: Estimated travel time in minutes
            - distance: Estimated total distance
    """
    if len(offices) < 2:
        # No optimization needed for 0 or 1 office
        return {
            "waypoints": [offices[0]["id"]] if offices else [],
            "estimated_duration": 0,
            "distance": 0
        }
    
    # Create distance matrix
    # For now, use Haversine distance (straight-line distance)
    # In production, you'd use actual road distances via Google Maps API
    num_locations = len(offices)
    distance_matrix = []
    
    for i in range(num_locations):
        row = []
        for j in range(num_locations):
            if i == j:
                row.append(0)
            else:
                # Calculate Haversine distance
                dist = haversine_distance(
                    offices[i].get("coordinates", {}).get("lat", 0),
                    offices[i].get("coordinates", {}).get("lng", 0),
                    offices[j].get("coordinates", {}).get("lat", 0),
                    offices[j].get("coordinates", {}).get("lng", 0)
                )
                # Convert to time estimate (assuming 30 mph average)
                time_minutes = int(dist * 1.2)  # Rough estimate: 1.2 minutes per mile
                row.append(time_minutes)
        distance_matrix.append(row)
    
    # Create routing model
    manager = pywrapcp.RoutingIndexManager(num_locations, 1, 0)  # 1 vehicle, start at 0
    routing = pywrapcp.RoutingModel(manager)
    
    def distance_callback(from_index, to_index):
        """Returns the distance between the two nodes"""
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Set search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = 5  # 5 second timeout
    
    # Solve
    solution = routing.SolveWithParameters(search_parameters)
    
    if solution:
        # Extract route
        waypoints = []
        index = routing.Start(0)
        total_distance = 0
        
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            waypoints.append(offices[node]["id"])
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            total_distance += routing.GetArcCostForVehicle(previous_index, index, 0)
        
        return {
            "waypoints": waypoints,
            "estimated_duration": total_distance,  # Already in minutes
            "distance": total_distance * 0.83  # Rough conversion: minutes to miles
        }
    else:
        # Fallback: return offices in original order
        return {
            "waypoints": [office["id"] for office in offices],
            "estimated_duration": sum(distance_matrix[i][i+1] for i in range(len(offices)-1)),
            "distance": 0
        }

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    Returns distance in miles
    """
    from math import radians, cos, sin, asin, sqrt
    
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 3956  # Radius of earth in miles
    
    return c * r

