import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PokemonService {
    constructor(
        @InjectModel(Pokemon.name)
        private readonly pokemonModel: Model<Pokemon>,
    ) {}

    async create(createPokemonDto: CreatePokemonDto) {
        createPokemonDto.name = createPokemonDto.name.toLowerCase();

        try {
            return await this.pokemonModel.create(createPokemonDto);
        } catch (error) {
            this.handleExceptions(error);
        }
    }

    findAll(paginationDto: PaginationDto) {
        const { limit = 10, offset = 0 } = paginationDto;
        return this.pokemonModel
            .find()
            .limit(limit)
            .skip(offset)
            .sort({ no: 1 })
            .select('-__v');
    }

    async findOne(term: string) {
        let pokemon: Pokemon;

        if (!isNaN(+term)) {
            pokemon = await this.pokemonModel.findOne({ no: term });
        } else if (isValidObjectId(term)) {
            pokemon = await this.pokemonModel.findById(term);
        } else {
            pokemon = await this.pokemonModel.findOne({
                name: term.toLowerCase().trim(),
            });
        }

        if (!pokemon) throw new NotFoundException(`Pokemon not found`);

        return pokemon;
    }

    async update(term: string, updatePokemonDto: UpdatePokemonDto) {
        const pokemon = await this.findOne(term);

        if (updatePokemonDto.name) {
            updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
        }

        try {
            await pokemon.updateOne(updatePokemonDto, { new: true });
            return { ...pokemon.toJSON(), ...updatePokemonDto };
        } catch (error) {
            this.handleExceptions(error);
        }
    }

    async remove(id: string) {
        const pokemon = await this.pokemonModel.findByIdAndDelete(id);
        if (!pokemon) throw new NotFoundException(`Pokemon not found`);
        return pokemon;
    }

    private handleExceptions(error: any) {
        if (error.code === 11000) {
            throw new BadRequestException(
                `Pokemon already exists ${JSON.stringify(error.keyValue)}`,
            );
        }

        throw new InternalServerErrorException();
    }
}
