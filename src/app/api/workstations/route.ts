import { NextResponse } from 'next/server';
import { getWorkstations, addWorkstation, updateWorkstation, deleteWorkstation, updateWorkstationPositions, resolveWorkstationRestaurantId } from '@/lib/database-service';
import { IWorkstation } from '@/models/Workstation';

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'An unknown error occurred';

interface WorkstationPayload {
  id?: string;
  restaurantId?: string;
  name?: string;
  states?: IWorkstation['states'];
  position?: number;
  isFixed?: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          error: 'restaurantId is required',
          message: 'restaurantId query parameter is required'
        },
        { status: 400 }
      );
    }
    
    const workstations = await getWorkstations(restaurantId);
    return NextResponse.json({
      success: true,
      data: workstations,
      error: null,
      message: null
    });
  } catch (error: unknown) {
    console.error('Error fetching workstations:', error);
    const status = toErrorMessage(error).includes('Database connection failed') ? 503 : 500;
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: toErrorMessage(error) || 'Failed to fetch workstations',
        message: toErrorMessage(error)
      },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const workstationData = await request.json() as WorkstationPayload;
    
    // Validate restaurantId
    if (!workstationData.restaurantId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'restaurantId is required',
          message: 'restaurantId is required in request body'
        },
        { status: 400 }
      );
    }
    
    // Validate workstation data
    if (!workstationData.name || workstationData.name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Workstation name is required',
          message: 'Workstation name is required'
        },
        { status: 400 }
      );
    }
    
    // Add default states
    workstationData.states = {
      new: 'new',
      inProgress: 'in progress',
      ready: 'ready'
    };
    
    const workstation = await addWorkstation({
      restaurantId: workstationData.restaurantId!,
      name: workstationData.name!,
      states: workstationData.states!,
      position: workstationData.position ?? 0,
      isFixed: workstationData.isFixed ?? false,
    } as Omit<IWorkstation, 'id'>);
    return NextResponse.json({ 
      success: true,
      data: workstation,
      error: null,
      message: 'Workstation created successfully'
    });
  } catch (error: unknown) {
    console.error('Error creating workstation:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: toErrorMessage(error),
        message: toErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

// Dedicated endpoint for updating positions
export async function PATCH(request: Request) {
  try {
    const { positions } = await request.json();
    
    if (!positions || !Array.isArray(positions)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Invalid positions data',
          message: 'Positions must be an array'
        },
        { status: 400 }
      );
    }
    
    // Update the positions (scoped to the restaurant owning these stations)
    const firstWid = positions[0]?.id;
    const restaurantId = await resolveWorkstationRestaurantId(firstWid);
    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'restaurantId is required',
          message: 'Unable to resolve restaurant for positions'
        },
        { status: 400 }
      );
    }
    const updatedWorkstations = await updateWorkstationPositions(restaurantId, positions);
    
    return NextResponse.json({ 
      success: true,
      data: updatedWorkstations,
      error: null,
      message: 'Workstation positions updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error updating workstation positions:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: toErrorMessage(error),
        message: toErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json() as WorkstationPayload;
    
    // Regular workstation update (not position update)
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Workstation id is required',
          message: 'Workstation id is required'
        },
        { status: 400 }
      );
    }

    // Validate workstation data if provided
    if (updateData.name !== undefined && updateData.name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Workstation name cannot be empty',
          message: 'Workstation name cannot be empty'
        },
        { status: 400 }
      );
    }
    
    const restaurantId = updateData.restaurantId || (await resolveWorkstationRestaurantId(id));
    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'restaurantId is required',
          message: 'restaurantId is required'
        },
        { status: 400 }
      );
    }

    const result = await updateWorkstation(id, restaurantId, updateData);
    if (result) {
      // Get the updated workstation to return in the response
      const updatedWorkstation = await getWorkstations(restaurantId);
      const workstation = updatedWorkstation.find((w: IWorkstation) => w.id === id);
      return NextResponse.json({ 
        success: true,
        data: workstation,
        error: null,
        message: 'Workstation updated successfully'
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Workstation not found or not updated',
          message: 'Workstation not found or not updated'
        },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    console.error('Error updating workstation:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: toErrorMessage(error),
        message: toErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const restaurantId = await resolveWorkstationRestaurantId(id);
    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Workstation not found',
          message: 'Workstation not found'
        },
        { status: 404 }
      );
    }
    const result = await deleteWorkstation(id, restaurantId);
    if (result) {
      return NextResponse.json({ 
        success: true,
        data: null,
        error: null,
        message: 'Workstation deleted successfully'
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Workstation not found',
          message: 'Workstation not found'
        },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    const isFixedError = String(toErrorMessage(error)).includes('cannot be deleted');
    console.error('Error deleting workstation:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: toErrorMessage(error),
        message: toErrorMessage(error)
      },
      { status: isFixedError ? 400 : 500 }
    );
  }
}