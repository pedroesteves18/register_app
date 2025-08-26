import Cirurgia from "../model/cirurgia.js";
import pacienteService from "../../paciente/service/paciente.js";
import bucket from "../../jobs/bucket.js";

const cirurgiaService = {
    createCirurgia: async (data) => {
        const {uploadedUrls, errors} = await cirurgiaService.insertPictures(data.pics)
        if(errors.length > 0) return errors
        
        const [day, month, year] = data.data.split('/');
        data.data = `${year}-${month}-${day}`;
        
        return await Cirurgia.create({
            descrição: data.descrição,
            data: data.data,
            fotos: uploadedUrls,
            pacienteId: data.pacienteId 
        })        
    },
    fetchPacienteCirurgias: async (pacienteId) => {
        return await Cirurgia.findAll({
            where: {
                pacienteId: pacienteId 
            },
            order: [['data', 'DESC']]
        })
    },
    deleteCirurgia: async (cirurgia) => {
        const isDeleted = await cirurgiaService.deletePictures(cirurgia.pics)
        if(!isDeleted) return null
        let destroyed = await Cirurgia.destroy({
            where: {
                id: cirurgia.id
            }
        })
        return destroyed
    },  
    fetchCirurgia: async (cirurgiaId) => {
        return await Cirurgia.findOne({
            where: {
                id: cirurgiaId
            }
        })
    },
    updateCirurgia: async (data) => {
        const beforeUpdate = await cirurgiaService.fetchCirurgia(data.id)
        if (!beforeUpdate) return null

        let totalUrls = [...beforeUpdate.fotos]

        // Handle existing photos that should be kept
        if (data.existingFotos && Array.isArray(data.existingFotos)) {
            // Find photos that were removed and delete them from S3
            const removedPhotos = beforeUpdate.fotos.filter(photo => !data.existingFotos.includes(photo))
            if (removedPhotos.length > 0) {
                await cirurgiaService.deletePictures(removedPhotos)
            }
            totalUrls = data.existingFotos
        }

        // Handle new photos upload
        if (data.pics && Array.isArray(data.pics) && data.pics.length > 0) {
            const {uploadedUrls, errors} = await cirurgiaService.insertPictures(data.pics)
            if(errors.length > 0) return errors
            totalUrls = [...totalUrls, ...uploadedUrls]
        }

        // Format date if provided
        let formattedDate = beforeUpdate.data
        if(data.data) {
            formattedDate = pacienteService.formatDate(data.data)
        }

        // Use descricao from request or keep existing
        const description = data.descricao || beforeUpdate.descrição

        return await Cirurgia.update({
            descrição: description,
            data: formattedDate,
            fotos: totalUrls
        },
        {
            where: {
                id: data.id
            }
        })
    },
    deletePictures: async (pictures) => {
        if(!pictures) return true
        if(!Array.isArray(pictures)) pictures = [pictures]
        for(const picture of pictures){
            const isDeleted = await bucket.s3Delete(picture)
            if(!isDeleted) return null
        }
        return true
    },
    insertPictures: async (pictures) => {
        if(!Array.isArray(pictures)) pictures = [pictures]

        const results = await Promise.all(pictures.map(async (picture) => {
            try {
                const uploadedUrl = await bucket.bucketImageUpload(picture);
                return { uploadedUrl, error: null };
            } catch (err) {
                return { uploadedUrl: null, error: picture };
            }
        }));
        const uploadedUrls = results.filter(r => r.uploadedUrl).map(r => r.uploadedUrl);
        const errors = results.filter(r => r.error).map(r => r.error);
        return { uploadedUrls, errors };
    },
    fetchAllCirurgias: async (userId) => {
        const pacientes = await pacienteService.fetchUsersPacientes(userId)
        return await Cirurgia.findAll({
            where: {
                pacienteId: pacientes.map(paciente => paciente.id)
            }
        })
    }

}

export default cirurgiaService