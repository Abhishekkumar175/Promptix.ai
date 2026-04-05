import { Heart, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CommunityImageCard({ image, onLike }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="bg-[#0B101A] rounded-2xl shadow-xl overflow-hidden group relative border border-white/5 hover:border-white/20 transition-all duration-500"
    >
      {/* Decorative Glow on Hover */}
      <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <img
          src={image.imageUrl}
          alt={image.prompt}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Top Overlay tools */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 flex items-center gap-1.5">
             <div className="w-4 h-4 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 border border-white/20" />
             <span className="text-[10px] text-white font-medium truncate max-w-[80px]">{image.createdBy}</span>
           </div>
           <button className="bg-black/60 backdrop-blur-md p-1.5 rounded-md border border-white/10 text-white hover:bg-white/20 transition-colors">
              <Maximize2 size={12} />
           </button>
        </div>

        {/* Deep Bottom Blur Overlay for Content */}
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-linear-to-t from-[#0B101A] via-[#0B101A]/80 to-transparent pointer-events-none" />

        {/* Content Container (Positioned at bottom over the blur) */}
        <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col justify-end">
           <p className="text-[13px] text-gray-200 font-medium line-clamp-2 leading-snug mb-3">
             "{image.prompt}"
           </p>

           <div className="flex items-center justify-between">
             <button
               onClick={() => onLike(image.id)}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all duration-300
                 ${image.liked 
                   ? "bg-red-500/20 border-red-500/30 text-red-400" 
                   : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                 }`}
             >
               <motion.div whileTap={{ scale: 0.8 }}>
                 <Heart size={14} className={image.liked ? "fill-red-400" : ""} />
               </motion.div>
               <span className="text-xs font-bold">{image.likes}</span>
             </button>

             <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold bg-white/5 px-2 py-1 rounded-md border border-white/5">
                Copy Prompt
             </span>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
