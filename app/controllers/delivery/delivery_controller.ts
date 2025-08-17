import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user/user'
import DeliveryOrder from '#models/delivery/delivery_order'
import DeliveryOrderService from '#modules/delivery/services/delivery_order_service'

import ResponseHelper from '#helpers/responses/responses_helper'

export default class DeliveryController {
    /**
     * Display a listing of deliveries for authenticated user
     * GET /delivery
     */
    async index({ auth, response }: HttpContext) {
        try {
        // Get authenticated user
        const user = auth.user!
        
        // Get deliveries for the authenticated user
        const deliveries = await DeliveryOrder.query()
            .where('user_id', user.id)
            .orderBy('created_at', 'desc')

        const paginatedDeliveries = deliveries.paginate(1, 10)
        const deliveriesResponse = ResponseHelper.format(paginatedDeliveries)
        
        
        return response.ok({
            success: true,
            ...deliveriesResponse
        })
    } catch (error) {
        return response.internalServerError({
            success: false,
            message: 'Failed to fetch deliveries',
            error: error.message
        })
        }
    }

    /**
     * Display a single delivery for authenticated user
     * GET /delivery/:id
     */
    async show({ auth, params, response }: HttpContext) {
        try {
            const user = auth.user!
            const deliveryId = params.id
            
            // Find delivery that belongs to the authenticated user
            const delivery = await DeliveryOrder.query()
                .where('id', deliveryId)
                .where('user_id', user.id)
                .first()
            
            if (!delivery) {
                return response.notFound({
                    success: false,
                    message: 'Delivery not found'
                })
            }
            
            return response.ok({
                success: true,
                data: delivery.serialize()
            })
        } catch (error) {
            return response.internalServerError({
                success: false,
                message: 'Failed to fetch delivery',
                error: error.message
            })
        }
    }

    /**
     * Display all deliveries for workers (privileged users)
     * GET /delivery/worker
     */
    async workerIndex({ auth, request, response }: HttpContext) {
        try {
            const user = auth.user!
            const active: boolean = request.input('active')

            
            // Check if user has worker privileges
            if (!this.isWorker(user)) {
                return response.forbidden({
                success: false,
                message: 'Access denied. Worker privileges required.'
                })
            }
            
            // Get all deliveries with user information
            let deliveries: DeliveryOrder[]

            if (!active){
                deliveries = await DeliveryOrder.query()
                    .where('delivery_worker_id', worker.id)
                    .orderBy('created_at', 'desc')
            }

            deliveries = await DeliveryOrder.query()
                .where('delivery_worker_id', worker.id)
                .where("status", "in_transit")
                .orderBy('created_at', 'desc')

           
            
            return response.ok({
                success: true,
                data: deliveries
            })
            } catch (error) {
            return response.internalServerError({
                success: false,
                message: 'Failed to fetch deliveries',
                error: error.message
            })
        }
    }

    /**
     * Get unassigned deliveries for worker assignment
     * GET /delivery/worker/assign
     */
    async workerAssign({ auth, request, response }: HttpContext) {
        try {
            const worker = auth.user!

            
            // Check if user has worker privileges
            if (!this.isWorker(user)) {
                return response.forbidden({
                success: false,
                message: 'Access denied. Worker privileges required.'
                })
            }
            
            // Get unassigned deliveries
            const unassignedDeliveries = await DeliveryOrder.query()
                //.whereNull('assigned_worker_id')
                .where('delivery_worker_id', worker.id)
                .orderBy('created_at', 'asc')
            
            return response.ok({
                success: true,
                data: unassignedDeliveries
            })
            } catch (error) {
            return response.internalServerError({
                success: false,
                message: 'Failed to fetch unassigned deliveries',
                error: error.message
            })
        }
    }

    /**
     * Update delivery status and assignment (workers only)
     * PATCH /delivery/worker/update-delivery
     */
    async updateDelivery({ auth, request, response }: HttpContext) {
        try {
        const user = auth.user!
        
        // Check if user has worker privileges
        if (!this.isWorker(user)) {
            return response.forbidden({
            success: false,
            message: 'Access denied. Worker privileges required.'
            })
        }
        
        const {
            deliveryId,
            status,
            assignedWorkerId,
            notes
        } = request.only(['deliveryId', 'status', 'assignedWorkerId', 'notes'])
        
        // Validate required fields
        if (!deliveryId) {
            return response.badRequest({
            success: false,
            message: 'Delivery ID is required'
            })
        }
        
        // Find the delivery
        const delivery = await DeliveryOrder.find(deliveryId)
        
        if (!delivery) {
            return response.notFound({
            success: false,
            message: 'Delivery not found'
            })
        }
        
        // Update delivery fields
        if (status) {
            delivery.status = status
        }
        
        if (assignedWorkerId) {
            // Verify the assigned worker exists and is a worker
            const assignedWorker = await User.find(assignedWorkerId)
            if (!assignedWorker || !this.isWorker(assignedWorker)) {
            return response.badRequest({
                success: false,
                message: 'Invalid worker assignment'
            })
            }
            delivery.assignedWorkerId = assignedWorkerId
        }
        
        if (notes) {
            delivery.notes = notes
        }
        
        // Set updated by worker
        delivery.updatedBy = user.id
        
        await delivery.save()
        
        // Load relationships for response
        await delivery.load('user')
        if (delivery.assignedWorkerId) {
            await delivery.load('assignedWorker')
        }
        
        return response.ok({
            success: true,
            message: 'Delivery updated successfully',
            data: delivery
        })
        } catch (error) {
        return response.internalServerError({
            success: false,
            message: 'Failed to update delivery',
            error: error.message
        })
        }
    }

    /**
     * Helper method to check if user has worker privileges
     */
    private isWorker(user: User): boolean {
        // Adjust this logic based on your user model structure
        // This could be a role field, permission check, etc.
        return user.role === 'worker' || user.role === 'admin' || user.isWorker === true
    }
}