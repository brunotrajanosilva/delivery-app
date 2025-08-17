// app/utils/paginated_response.ts
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'

export interface PaginatedData<T = any> {
  data: T[]
  pagination: {
    currentPage: number
    perPage: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    nextPageUrl?: string
    previousPageUrl?: string
  }
}

export default class ResponseHelper {
  
    static format<T = any>(
        paginatedQuery: ModelPaginatorContract<T>,
        baseUrl?: string
    ): PaginatedData<T> {
        const pagination = paginatedQuery.getMeta()
        
        return {
            data: paginatedQuery.serialize().data,
            pagination: {
                currentPage: pagination.currentPage,
                perPage: pagination.perPage,
                total: pagination.total,
                totalPages: pagination.lastPage,
                hasNextPage: pagination.hasNextPage,
                hasPreviousPage: pagination.hasPreviousPage,
                nextPageUrl: this.buildPageUrl(baseUrl, pagination.currentPage + 1, pagination.hasNextPage),
                previousPageUrl: this.buildPageUrl(baseUrl, pagination.currentPage - 1, pagination.hasPreviousPage)
            }
        }
    }

    static errorResponse = (msg: string, error?: Error)=>{
        const result = {
            success: false,
            message: msg,
        }
        if (error){
            result.error = error.message
        }
        return result
    }

  static formatWithTransform<T = any, R = any>(
    paginatedQuery: ModelPaginatorContract<T>,
    transformer: (item: T) => R,
    baseUrl?: string
  ): PaginatedData<R> {
    const pagination = paginatedQuery.getMeta()
    const transformedData = paginatedQuery.serialize().data.map(transformer)
    
    return {
      data: transformedData,
      pagination: {
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        total: pagination.total,
        totalPages: pagination.lastPage,
        hasNextPage: pagination.hasNextPage,
        hasPreviousPage: pagination.hasPreviousPage,
        nextPageUrl: this.buildPageUrl(baseUrl, pagination.currentPage + 1, pagination.hasNextPage),
        previousPageUrl: this.buildPageUrl(baseUrl, pagination.currentPage - 1, pagination.hasPreviousPage)
      }
    }
  }

  /**
   * Build page URL for pagination links
   */
  private static buildPageUrl(baseUrl: string | undefined, page: number, hasPage: boolean): string | undefined {
    if (!baseUrl || !hasPage) return undefined
    
    const url = new URL(baseUrl)
    url.searchParams.set('page', page.toString())
    return url.toString()
  }

  /**
   * Create empty paginated response
   */
  static empty<T = any>(): PaginatedData<T> {
    return {
      data: [],
      pagination: {
        currentPage: 1,
        perPage: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    }
  }
}