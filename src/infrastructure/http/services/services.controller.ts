import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServiceCatalogService } from '../../../application/services/service-catalog.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ListServicesQuery } from './dto/list-services.query';
import { ErrorResponseDto } from '../../../shared/swagger/error-response.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'List workshop services',
    description:
      'Returns a paginated list of workshop services. Supports filtering by active status and full-text search.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of services' })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    type: ErrorResponseDto,
  })
  findAll(@Query() query: ListServicesQuery) {
    return this.serviceCatalogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({
    name: 'id',
    description: 'Service MongoDB ObjectId',
    example: '6646b1f2a3e4c5d6e7f8a9b1',
  })
  @ApiResponse({ status: 200, description: 'Service found' })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.serviceCatalogService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a workshop service',
    description:
      'Creates a new service with an auto-generated SKU (SVC-{uuid}).',
  })
  @ApiResponse({ status: 201, description: 'Service created' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateServiceDto) {
    return this.serviceCatalogService.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a workshop service',
    description:
      'Updates any combination of name, description, estimated duration and labor cost.',
  })
  @ApiParam({
    name: 'id',
    description: 'Service MongoDB ObjectId',
    example: '6646b1f2a3e4c5d6e7f8a9b1',
  })
  @ApiResponse({ status: 200, description: 'Service updated' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
    type: ErrorResponseDto,
  })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceCatalogService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete a workshop service',
    description:
      'Deactivates the service (sets active=false). The service remains in the database for historical records.',
  })
  @ApiParam({
    name: 'id',
    description: 'Service MongoDB ObjectId',
    example: '6646b1f2a3e4c5d6e7f8a9b1',
  })
  @ApiResponse({ status: 204, description: 'Service deactivated' })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
    type: ErrorResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.serviceCatalogService.softDelete(id);
  }
}
