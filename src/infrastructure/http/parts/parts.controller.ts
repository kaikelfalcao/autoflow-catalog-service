import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartCatalogService } from '../../../application/parts/part-catalog.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { ReplenishStockDto } from './dto/replenish-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ListPartsQuery } from './dto/list-parts.query';
import { ListMovementsQuery } from './dto/list-movements.query';
import { ErrorResponseDto } from '../../../shared/swagger/error-response.dto';

@ApiTags('Parts')
@Controller('parts')
export class PartsController {
  constructor(private readonly partCatalogService: PartCatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'List parts',
    description:
      'Returns a paginated list of parts. Supports filtering by category, active status and full-text search.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of parts' })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ErrorResponseDto,
  })
  findAll(@Query() query: ListPartsQuery) {
    return this.partCatalogService.findAll(query);
  }

  @Get('low-stock')
  @ApiOperation({
    summary: 'List low-stock parts',
    description:
      'Returns all parts whose current stock is at or below the configured minimum stock level.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of parts below minimum stock',
  })
  async findLowStock() {
    const data = await this.partCatalogService.findLowStock();
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get part by ID' })
  @ApiParam({
    name: 'id',
    description: 'Part MongoDB ObjectId',
    example: '6646b1f2a3e4c5d6e7f8a9b0',
  })
  @ApiResponse({ status: 200, description: 'Part found' })
  @ApiResponse({
    status: 404,
    description: 'Part not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.partCatalogService.findById(id);
  }

  @Get(':id/movements')
  @ApiOperation({
    summary: 'Get stock movements for a part',
    description:
      'Returns a paginated and filterable history of all stock movements (IN, OUT, RESERVE, RELEASE) for the given part.',
  })
  @ApiParam({
    name: 'id',
    description: 'Part MongoDB ObjectId',
    example: '6646b1f2a3e4c5d6e7f8a9b0',
  })
  @ApiResponse({ status: 200, description: 'Paginated movement history' })
  @ApiResponse({
    status: 404,
    description: 'Part not found',
    type: ErrorResponseDto,
  })
  findMovements(@Param('id') id: string, @Query() query: ListMovementsQuery) {
    return this.partCatalogService.findMovements(id, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new part',
    description:
      'Creates a part with an auto-generated SKU. If stockQuantity > 0, an initial IN movement is recorded.',
  })
  @ApiResponse({ status: 201, description: 'Part created' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreatePartDto) {
    return this.partCatalogService.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a part',
    description:
      'Updates name, attributes and minimumStock. Stock quantities can only be changed via replenish or adjust endpoints.',
  })
  @ApiParam({
    name: 'id',
    description: 'Part MongoDB ObjectId',
    example: '6646b1f2a3e4c5d6e7f8a9b0',
  })
  @ApiResponse({ status: 200, description: 'Part updated' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Part not found',
    type: ErrorResponseDto,
  })
  update(@Param('id') id: string, @Body() dto: UpdatePartDto) {
    return this.partCatalogService.update(id, dto);
  }

  @Patch(':id/replenish')
  @ApiOperation({
    summary: 'Replenish stock',
    description:
      'Adds units to stock (IN movement). Resets the low-stock alert flag if stock returns above minimum.',
  })
  @ApiParam({
    name: 'id',
    description: 'Part MongoDB ObjectId',
    example: '6646b1f2a3e4c5d6e7f8a9b0',
  })
  @ApiResponse({ status: 200, description: 'Stock replenished' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Part not found',
    type: ErrorResponseDto,
  })
  replenish(@Param('id') id: string, @Body() dto: ReplenishStockDto) {
    return this.partCatalogService.replenish(id, dto);
  }

  @Patch(':id/adjust')
  @ApiOperation({
    summary: 'Manual stock adjustment',
    description:
      'Sets stock to an exact quantity. Creates an IN or OUT movement based on the difference.',
  })
  @ApiParam({
    name: 'id',
    description: 'Part MongoDB ObjectId',
    example: '6646b1f2a3e4c5d6e7f8a9b0',
  })
  @ApiResponse({ status: 200, description: 'Stock adjusted' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Part not found',
    type: ErrorResponseDto,
  })
  adjust(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.partCatalogService.adjustStock(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete a part',
    description:
      'Deactivates the part (sets active=false). Blocked if the part has ACTIVE stock reservations.',
  })
  @ApiParam({
    name: 'id',
    description: 'Part MongoDB ObjectId',
    example: '6646b1f2a3e4c5d6e7f8a9b0',
  })
  @ApiResponse({ status: 204, description: 'Part deactivated' })
  @ApiResponse({
    status: 404,
    description: 'Part not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Part has active reservations',
    type: ErrorResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.partCatalogService.softDelete(id);
  }
}

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly partCatalogService: PartCatalogService) {}

  @Get('os/:osId')
  @ApiOperation({
    summary: 'Get reservations by OS ID',
    description:
      'Returns all stock reservations associated with a given service order (OS).',
  })
  @ApiParam({
    name: 'osId',
    description: 'Service Order ID',
    example: 'os-2026-00042',
  })
  @ApiResponse({ status: 200, description: 'List of reservations for the OS' })
  findByOsId(@Param('osId') osId: string) {
    return this.partCatalogService.findReservationsByOsId(osId);
  }
}
