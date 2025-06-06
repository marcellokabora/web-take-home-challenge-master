import { useState, useEffect } from 'react';
import { Vehicle, ShareNowVehicle, FreeNowVehicle, VehicleState, VehicleCondition, EngineType } from '../types/vehicles';
import shareNowData from '../mocks/sharenow.json';
import freeNowData from '../mocks/freenow.json';

// Helper type for normalized coordinates
interface NormalizedCoordinates {
    lat: number;
    lng: number;
}

// Helper function to normalize coordinates
const normalizeCoordinates = (vehicle: ShareNowVehicle | FreeNowVehicle): NormalizedCoordinates => {
    if ('coordinates' in vehicle) {
        // SHARE TAXI vehicle
        return {
            lat: vehicle.coordinates[1],
            lng: vehicle.coordinates[0]
        };
    } else {
        // TAXI NOW vehicle
        return {
            lat: vehicle.coordinate.latitude,
            lng: vehicle.coordinate.longitude
        };
    }
};

// Helper functions for vehicle data transformation
const getVehicleCoordinates = (vehicle: Vehicle): string => {
    if (vehicle.provider === 'SHARE TAXI') {
        const shareVehicle = vehicle as ShareNowVehicle;
        return `${shareVehicle.coordinates[0]}, ${shareVehicle.coordinates[1]}`;
    } else {
        const freeVehicle = vehicle as FreeNowVehicle;
        return `${freeVehicle.coordinate.longitude}, ${freeVehicle.coordinate.latitude}`;
    }
};

const getVehicleAddress = (vehicle: Vehicle): string => {
    if (vehicle.provider === 'SHARE TAXI') {
        const shareVehicle = vehicle as ShareNowVehicle;
        return shareVehicle.address;
    }
    return '-';
};

const getVehicleFuel = (vehicle: Vehicle): number | undefined => {
    if (vehicle.provider === 'SHARE TAXI') {
        const shareVehicle = vehicle as ShareNowVehicle;
        return shareVehicle.fuel;
    }
    return undefined;
};

export const useVehicles = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                setIsLoading(true);

                // Transform SHARE TAXI vehicles
                const shareNowVehicles: ShareNowVehicle[] = shareNowData.placemarks.map(vehicle => ({
                    ...vehicle,
                    provider: 'SHARE TAXI' as const,
                    normalizedCoordinates: normalizeCoordinates(vehicle as ShareNowVehicle),
                    displayCoordinates: `${vehicle.coordinates[0]}, ${vehicle.coordinates[1]}`,
                    displayAddress: vehicle.address,
                    displayFuel: vehicle.fuel,
                    state: vehicle.state as VehicleState,
                    condition: vehicle.condition as VehicleCondition,
                    coordinates: vehicle.coordinates as [number, number, number],
                    engineType: vehicle.engineType as EngineType
                }));

                // Transform TAXI NOW vehicles
                const freeNowVehicles: FreeNowVehicle[] = freeNowData.poiList.map(vehicle => ({
                    id: vehicle.id,
                    coordinate: vehicle.coordinate,
                    state: vehicle.state as VehicleState,
                    licencePlate: vehicle.licencePlate,
                    condition: vehicle.condition as VehicleCondition,
                    provider: 'TAXI NOW' as const,
                    normalizedCoordinates: normalizeCoordinates(vehicle as FreeNowVehicle),
                    displayCoordinates: `${vehicle.coordinate.longitude}, ${vehicle.coordinate.latitude}`,
                    displayAddress: '-',
                    displayFuel: undefined
                }));

                // Combine both sets of vehicles
                const allVehicles = [...shareNowVehicles, ...freeNowVehicles];

                // Add a delay of 2 seconds to simulate loading
                await new Promise(resolve => setTimeout(resolve, 2000));

                setVehicles(allVehicles);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch vehicles'));
                console.error('Error fetching vehicles:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    return {
        vehicles,
        isLoading,
        error,
        getVehicleCoordinates,
        getVehicleAddress,
        getVehicleFuel
    };
}; 